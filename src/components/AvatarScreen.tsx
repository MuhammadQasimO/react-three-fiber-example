import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  Animated,
} from 'react-native';
import {Canvas} from '@react-three/fiber/native';
import {Suspense} from 'react';
import Avatar3D from './Avatar3D';
import {responsive} from '../utils/responsive';

// ✅ Hermes-compatible patch for WebGL getProgramInfoLog
if (
  (global as any).WebGLRenderingContext &&
  typeof (global as any).WebGLRenderingContext.prototype.getProgramInfoLog ===
    'function'
) {
  const original = (global as any).WebGLRenderingContext.prototype
    .getProgramInfoLog;
  (global as any).WebGLRenderingContext.prototype.getProgramInfoLog = function (
    ...args: any[]
  ) {
    const result = original.apply(this, args);
    return typeof result === 'string' ? result : '';
  };
}

const {width, height} = Dimensions.get('window');

// Simple Loader component as shown in the R3F documentation
const Loader: React.FC = () => {
  return (
    <View style={styles.loaderContainer}>
      <Text style={styles.loaderText}>Loading 3D Model...</Text>
    </View>
  );
};

const AvatarScreen: React.FC = () => {
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [avatarError, setAvatarError] = useState<string | undefined>();
  const [isBridgeReady, setIsBridgeReady] = useState(false);

  // Animation values for loading indicator
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  // Check if React Native bridge is ready
  useEffect(() => {
    const checkBridgeReady = () => {
      // Wait for the bridge to be fully initialized
      setTimeout(() => {
        console.log('React Native bridge should be ready now');
        setIsBridgeReady(true);
      }, 1000); // Give extra time for bridge initialization
    };

    checkBridgeReady();
  }, []);

  // Start loading animations
  useEffect(() => {
    if (!avatarLoaded && !avatarError) {
      // Spin animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [avatarLoaded, avatarError]);

  // Filter out unwanted logs
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const shouldFilter = (message: string) => {
      const filters = [
        'EXGL:',
        'gl.pixelStorei',
        'gl.getParameter',
        'WebGL',
        'THREE.WebGLRenderer',
        'THREE.WebGLProgram',
        'THREE.WebGLShader',
      ];
      return filters.some(filter => message.includes(filter));
    };

    console.log = (...args) => {
      const message = args.join(' ');
      if (!shouldFilter(message)) {
        originalLog.apply(console, args);
      }
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      if (!shouldFilter(message)) {
        originalWarn.apply(console, args);
      }
    };

    console.error = (...args) => {
      const message = args.join(' ');
      if (!shouldFilter(message)) {
        originalError.apply(console, args);
      }
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  // Handle avatar load state changes
  const handleAvatarLoadStateChange = useCallback(
    (isLoaded: boolean, error?: string) => {
      console.log('Avatar load state changed:', {isLoaded, error});
      setAvatarLoaded(isLoaded);
      setAvatarError(error);
    },
    [],
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Status indicator */}
      <View style={styles.topRow}>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: avatarError
                  ? '#f44336'
                  : !isBridgeReady
                  ? '#888888'
                  : !avatarLoaded
                  ? '#ff9800'
                  : '#4CAF50',
              },
            ]}
          />
          <Text style={styles.statusText}>
            {avatarError
              ? 'Failed to load model'
              : !isBridgeReady
              ? 'Initializing...'
              : !avatarLoaded
              ? 'Loading Model...'
              : 'Ready'}
          </Text>
        </View>
      </View>

      {/* Full Screen 3D Avatar Canvas */}
      {isBridgeReady ? (
        <>
          <Canvas
            style={styles.canvas}
            camera={{
              position: [0, 0, 6],
              fov: 50,
            }}
            events={() => ({} as any)}
            gl={{
              powerPreference: 'default',
              antialias: false,
              alpha: false,
            }}
            onCreated={({gl, scene, camera, size, raycaster}) => {
              (gl as any).debug = {checkShaderErrors: false};
            }}>
            <Suspense fallback={<Loader />}>
              {/* Gradient Background */}
              <mesh position={[0, 0, -10]} scale={[20, 20, 1]}>
                <planeGeometry args={[1, 1]} />
                <shaderMaterial
                  vertexShader={`
                    varying vec2 vUv;
                    void main() {
                      vUv = uv;
                      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                  `}
                  fragmentShader={`
                    varying vec2 vUv;
                    void main() {
                      // Vertical gradient: black (top) to deep blue/gray (bottom)
                      vec3 topColor = vec3(0.02, 0.02, 0.05); // almost black
                      vec3 bottomColor = vec3(0.13, 0.18, 0.28); // deep blue/gray
                      vec3 base = mix(topColor, bottomColor, vUv.y);

                      // Radial spotlight effect (center bottom)
                      float dist = distance(vUv, vec2(0.5, 0.15));
                      float spotlight = 1.0 - smoothstep(0.18, 0.45, dist);
                      vec3 spotColor = vec3(0.25, 0.32, 0.45); // bluish spotlight
                      vec3 color = mix(base, spotColor, spotlight * 0.7);

                      gl_FragColor = vec4(color, 1.0);
                    }
                  `}
                />
              </mesh>
              <Avatar3D onLoadStateChange={handleAvatarLoadStateChange} />
            </Suspense>
          </Canvas>

          {/* Loading overlay when avatar is not loaded */}
          {!avatarLoaded && !avatarError && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                {/* Loading spinner */}
                <Animated.View
                  style={[
                    styles.spinner,
                    {
                      transform: [
                        {
                          rotate: spinValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}>
                  <View style={styles.spinnerRing} />
                </Animated.View>

                {/* Pulsing center dot */}
                <Animated.View
                  style={[
                    styles.centerDot,
                    {
                      transform: [{scale: pulseValue}],
                    },
                  ]}
                />

                {/* Loading text */}
                <View style={styles.loadingTextContainer}>
                  <Text style={styles.loadingText}>Loading Avatar...</Text>
                </View>
              </View>
            </View>
          )}

          {/* Error overlay when avatar fails to load */}
          {avatarError && (
            <View style={styles.errorOverlay}>
              <View style={styles.errorContainer}>
                <View style={styles.errorIcon}>
                  <Text style={styles.errorIconText}>⚠️</Text>
                </View>
                <Text style={styles.errorText}>Failed to load avatar</Text>
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.canvas}>
          {/* Loading placeholder */}
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Initializing...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  canvas: {
    width: width,
    height: height,
    backgroundColor: '#0a0a1a',
  },
  topRow: {
    position: 'absolute',
    top: responsive.isTablet ? responsive.scale(60) : responsive.scale(40),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    paddingHorizontal: responsive.padding.horizontal,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: responsive.scale(18),
    paddingVertical: responsive.scale(8),
    borderRadius: responsive.scale(24),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  statusIndicator: {
    width: responsive.scale(10),
    height: responsive.scale(10),
    borderRadius: responsive.scale(5),
    marginRight: responsive.scale(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusText: {
    color: '#ffffff',
    fontSize: responsive.scaleFontSize(14),
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: responsive.scaleFontSize(18),
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 26, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: responsive.scale(80),
    height: responsive.scale(80),
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerRing: {
    width: responsive.scale(80),
    height: responsive.scale(80),
    borderRadius: responsive.scale(40),
    borderWidth: responsive.scale(4),
    borderColor: '#4CAF50',
    borderTopColor: 'transparent',
  },
  centerDot: {
    position: 'absolute',
    width: responsive.scale(20),
    height: responsive.scale(20),
    borderRadius: responsive.scale(10),
    backgroundColor: '#FF9800',
    shadowColor: '#FF9800',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: responsive.scale(10),
    elevation: 5,
  },
  loadingTextContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 26, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorIcon: {
    width: responsive.scale(64),
    height: responsive.scale(64),
    borderRadius: responsive.scale(32),
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsive.scale(16),
    elevation: 4,
    shadowColor: '#ff4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  errorIconText: {
    fontSize: 30,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d4d4d4',
  },
  loaderText: {
    color: '#666666',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default AvatarScreen;

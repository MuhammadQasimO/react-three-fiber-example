/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import AvatarScreen from './src/components/AvatarScreen';

function App(): React.JSX.Element {
  return (
    <>
      <StatusBar hidden />
      <AvatarScreen />
    </>
  );
}

export default App;

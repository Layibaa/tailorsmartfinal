// index.js - UPDATED
import { registerRootComponent } from 'expo';
import React from 'react';
import App from './App';

// If your code is using setNativeProps somewhere around line 20, 
// you need to replace it with a state-based approach.
// Example of how to replace setNativeProps:

// BEFORE:
// someRef.current.setNativeProps({ style: { opacity: 0.5 } });

// AFTER:
// const [opacity, setOpacity] = useState(1);
// ...
// setOpacity(0.5);
// ...
// <View style={{ opacity: opacity }}>...</View>

// Register the main component
registerRootComponent(App);
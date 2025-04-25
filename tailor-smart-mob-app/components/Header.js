import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { theme } from '../utils/theme';
const logoSvg = require('../assets/logo.svg');

const Header = ({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  showLogo = false,
  style,
}) => {
  return (
    <View style={[styles.header, style]}>
      {leftIcon ? (
        <TouchableOpacity style={styles.iconContainer} onPress={onLeftPress}>
          <Ionicons name={leftIcon} size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}

      {showLogo ? (
        <SvgXml xml={logoSvg} width={160} height={40} />
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}

      {rightIcon ? (
        <TouchableOpacity style={styles.iconContainer} onPress={onRightPress}>
          <Ionicons name={rightIcon} size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 40,
  },
});

export default Header;
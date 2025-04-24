import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

const ChatBubble = ({ message, isMine, timestamp }) => {
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, isMine ? styles.containerRight : styles.containerLeft]}>
      <View 
        style={[
          styles.bubble, 
          isMine ? styles.bubbleMine : styles.bubbleOther
        ]}
      >
        <Text style={[styles.messageText, isMine ? styles.textMine : styles.textOther]}>
          {message}
        </Text>
        <Text style={[styles.timestamp, isMine ? styles.timestampMine : styles.timestampOther]}>
          {formatTime(timestamp)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    maxWidth: '80%',
  },
  containerLeft: {
    alignSelf: 'flex-start',
  },
  containerRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: 18,
    padding: 12,
    maxWidth: '100%',
  },
  bubbleMine: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: theme.colors.lightGray,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  textMine: {
    color: theme.colors.white,
  },
  textOther: {
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timestampMine: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timestampOther: {
    color: theme.colors.textLight,
  },
});

export default ChatBubble;
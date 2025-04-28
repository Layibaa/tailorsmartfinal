import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../styles/colors';

const ChatMessage = ({ message, isSender }) => {
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[
      styles.container,
      isSender ? styles.senderContainer : styles.receiverContainer
    ]}>
      <View style={[
        styles.bubble,
        isSender ? styles.senderBubble : styles.receiverBubble
      ]}>
        <Text style={[
          styles.messageText,
          isSender ? styles.senderText : styles.receiverText
        ]}>
          {message.content}
        </Text>
      </View>
      <Text style={[
        styles.timestamp,
        isSender ? styles.senderTimestamp : styles.receiverTimestamp
      ]}>
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%'
  },
  senderContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end'
  },
  receiverContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start'
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 2
  },
  senderBubble: {
    backgroundColor: colors.black
  },
  receiverBubble: {
    backgroundColor: colors.lightGray
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22
  },
  senderText: {
    color: colors.white
  },
  receiverText: {
    color: colors.black
  },
  timestamp: {
    fontSize: 12,
    marginHorizontal: 4
  },
  senderTimestamp: {
    color: colors.gray
  },
  receiverTimestamp: {
    color: colors.gray
  }
});

export default ChatMessage;

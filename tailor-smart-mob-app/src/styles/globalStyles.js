import { StyleSheet } from 'react-native';
import colors from './colors';

const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  screenContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.white
  },
  headerContainer: {
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 6
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.gray
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 16,
    marginTop: 16
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  errorText: {
    color: colors.error,
    marginTop: 4,
    marginBottom: 16
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 16
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: 16
  },
  buttonContainer: {
    marginTop: 16
  },
  iconButton: {
    padding: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 8
  },
  value: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 16
  },
  centeredText: {
    textAlign: 'center'
  }
});

export default globalStyles;

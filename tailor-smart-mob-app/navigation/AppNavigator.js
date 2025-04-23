const AppNavigator = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user ? (
        <>
          {user.role === 'admin' && (
            <Stack.Screen name="Admin" component={AdminNavigator} />
          )}
          {user.role === 'tailor' && (
            <Stack.Screen name="Tailor" component={TailorNavigator} />
          )}
          {user.role === 'customer' && (
            <Stack.Screen name="Customer" component={CustomerNavigator} />
          )}
        </>
      ) : null}
    </Stack.Navigator>
  );
};

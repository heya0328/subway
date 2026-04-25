import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { View } from 'react-native';

export const Route = createRoute('/feed', { component: FeedPage, screenOptions: { headerShown: false } });

function FeedPage() {
  const navigation = Route.useNavigation();
  React.useEffect(() => {
    navigation.navigate('/');
  }, []);
  return <View />;
}

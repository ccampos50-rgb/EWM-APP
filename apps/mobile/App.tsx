import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./lib/auth";
import { ClockOutScreen } from "./screens/ClockOutScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SiteDetailScreen } from "./screens/SiteDetailScreen";
import { SitesScreen } from "./screens/SitesScreen";
import { TaskDetailScreen } from "./screens/TaskDetailScreen";
import { TaskListScreen } from "./screens/TaskListScreen";
import type { RootStackParamList } from "./navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#1E3A8A" />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { color: "#0F172A" },
        headerTintColor: "#1E3A8A",
      }}
    >
      <Stack.Screen
        name="Sites"
        component={SitesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SiteDetail"
        component={SiteDetailScreen}
        options={{ title: "Site" }}
      />
      <Stack.Screen
        name="TaskList"
        component={TaskListScreen}
        options={{ title: "Tasks" }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: "Task" }}
      />
      <Stack.Screen
        name="ClockOut"
        component={ClockOutScreen}
        options={{ title: "Clock out" }}
      />
    </Stack.Navigator>
  );
}

// HomeScreen retained for backward-compat; not wired in the stack.
void HomeScreen;

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
});

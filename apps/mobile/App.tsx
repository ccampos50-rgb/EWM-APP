import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./lib/auth";
import "./lib/i18n";
import { colors } from "./lib/theme";
import { registerForPushNotifications } from "./lib/push";
import { AnimatedSplash } from "./screens/AnimatedSplash";
import { ClockOutScreen } from "./screens/ClockOutScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { IncidentReportScreen } from "./screens/IncidentReportScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SiteDetailScreen } from "./screens/SiteDetailScreen";
import { SitesScreen } from "./screens/SitesScreen";
import { TaskDetailScreen } from "./screens/TaskDetailScreen";
import { TaskListScreen } from "./screens/TaskListScreen";
import { WalkthroughScreen, WALKTHROUGH_DONE_KEY } from "./screens/WalkthroughScreen";
import type { RootStackParamList } from "./navigation/types";

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { session, loading } = useAuth();
  const [walkthroughDone, setWalkthroughDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(WALKTHROUGH_DONE_KEY).then((v) => setWalkthroughDone(v === "1"));
  }, []);

  useEffect(() => {
    if (!loading && walkthroughDone !== null) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading, walkthroughDone]);

  useEffect(() => {
    if (session) {
      registerForPushNotifications().catch((e) => console.warn("[push]", e));
    }
  }, [session]);

  if (loading || walkthroughDone === null) {
    return <View style={styles.preload} />;
  }

  if (!walkthroughDone) {
    return <WalkthroughScreen onDone={() => setWalkthroughDone(true)} />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTitleStyle: { color: "#FFFFFF", fontWeight: "600" },
        headerTintColor: "#FFFFFF",
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
      <Stack.Screen
        name="IncidentReport"
        component={IncidentReportScreen}
        options={{ title: "Report incident" }}
      />
    </Stack.Navigator>
  );
}

// HomeScreen retained for backward-compat; not wired in the stack.
void HomeScreen;

export default function App() {
  const [splashFinished, setSplashFinished] = useState(false);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        {!splashFinished && <AnimatedSplash onDone={() => setSplashFinished(true)} />}
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  preload: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
});

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "auth.initialRoute";
const DEFAULT_ROUTE = "SignIn";

let currentRoute = DEFAULT_ROUTE;
const listeners = new Set();
let hydrationPromise;

function notify() {
  listeners.forEach((listener) => {
    try {
      listener(currentRoute);
    } catch (error) {
      console.warn("authRoute subscriber error", error);
    }
  });
}

function hydrate() {
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && typeof stored === "string" && stored !== currentRoute) {
          currentRoute = stored;
          notify();
        }
      } catch (error) {
        console.warn("Failed to hydrate auth initial route", error);
      }
      return currentRoute;
    })();
  }
  return hydrationPromise;
}

hydrate();

export function getAuthInitialRoute() {
  hydrate();
  return currentRoute;
}

export function subscribeAuthInitialRoute(listener) {
  if (typeof listener !== "function") {
    return () => {};
  }

  listeners.add(listener);
  listener(currentRoute);
  hydrate();

  return () => {
    listeners.delete(listener);
  };
}

export async function setAuthInitialRoute(nextRoute) {
  if (typeof nextRoute !== "string" || !nextRoute) {
    return currentRoute;
  }

  if (nextRoute === currentRoute) {
    return currentRoute;
  }

  currentRoute = nextRoute;
  notify();

  try {
    await AsyncStorage.setItem(STORAGE_KEY, nextRoute);
  } catch (error) {
    console.warn("Failed to persist auth initial route", error);
  }

  return currentRoute;
}

export async function resetAuthInitialRoute() {
  currentRoute = DEFAULT_ROUTE;
  notify();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear auth initial route", error);
  }
  return currentRoute;
}

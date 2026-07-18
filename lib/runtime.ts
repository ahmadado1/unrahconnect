import Constants, { ExecutionEnvironment } from "expo-constants"

/** True when running inside the Expo Go app (not a dev/production build). */
export const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient

/** True for EAS/dev-client/production binaries where NativeTabs Liquid Glass works. */
export const isNativeBuild = !isExpoGo

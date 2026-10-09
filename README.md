# Scam Guardian

React Native app built with Expo SDK 57, React 19, TypeScript, and Expo Router. The project starts with Expo's default Home and Explore screens and supports Android, iOS, and web.

## Getting started

Use Node.js 24 LTS and npm. Install the locked dependencies and start the development server:

```sh
npm ci
npm start
```

Scan the QR code with a compatible version of [Expo Go](https://expo.dev/go), or use an emulator or development build.

```sh
npm run android   # Requires a running Android emulator or connected device
npm run ios       # Requires macOS and the iOS simulator
npm run web       # Opens the web app
```

On Windows, use a physical iPhone with Expo Go to test iOS.

## Project layout

- `src/app/`: Expo Router screens and layouts. Edit `src/app/index.tsx` to change the home screen.
- `src/components/`: Shared components, including native and web tab implementations.
- `src/hooks/`: Shared hooks.
- `src/constants/`: Theme values.
- `assets/`: Icons, splash screen, and images.
- `app.json`: Expo app configuration.

## Checks

```sh
npm run lint
npm run typecheck
npx expo install --check
npx expo-doctor
npx expo export --platform all
```

Exported bundles are written to the ignored `dist/` directory. Exporting verifies bundling; native builds require the corresponding platform tools or EAS Build.

## Resetting the starter

Run `npm run reset-project` to replace the starter with a blank `src/app/`. Choose `Y` to preserve the existing source and reset script under the ignored `example/` directory.

See the [Expo documentation](https://docs.expo.dev/) and [Expo Router guide](https://docs.expo.dev/router/introduction/) for further development.

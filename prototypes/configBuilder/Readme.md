To continue development on this project:

1. Move the `build` folder into
   `packages/imperative/src/imperative/src/config/cmd`
   with the following command:

   ```
   cp -R prototypes/configBuilder/build packages/imperative/src/imperative/src/config/cmd
   ```

2. Replace `ConfigManagementFacility.ts` with the version found here with the commands:

   ```
   rm packages/imperative/src/imperative/src/config/ConfigManagementFacility.ts
   cp prototypes/configBuilder/ConfigManagementFacility.ts packages/imperative/src/imperative/src/config/ConfigManagementFacility.ts
   ```

3. Add the `terminal-kit` dependency:

   ```
   cd packages/imperative && npm install --save terminal-kit && npm install --save-dev @types/terminal-kit && cd ../..
   ```

4. Make sure you do an `npm install` followed by `npm run build` once you move everything over.

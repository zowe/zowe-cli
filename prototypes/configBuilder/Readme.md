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
   npm install terminal-kit && npm install -D @types/terminal-kit
   ```

4. Make sure you do an `npm install` followed by `npm run build` once you move everything over.

5. To run the new command, you can add the following configuration to your `launch.json`:

   ```
      {
         "type": "node",
         "request": "launch",
         "name": "TUI",
         "program": "${workspaceFolder}/packages/cli/lib/main.js",
         "console": "integratedTerminal",
         "args": ["config", "build"],
         "outputCapture": "std"
      }
   ```

   Then you can run the TUI command from your VSCode debugging pannel.

   You can also run the version from source with:

   ```
   node node_modules/@zowe/cli/lib/main.js config build
   ```

# mods-and-plugins-sortor

Sort the mods and plugins in a profile of Mod Organizer 2, let the mod's name determine it's priority.

## Requirement

- [**Node.js**](nodejs.org)

  Node is a JavaScript runtime, download and install it.
  I'm sorry for that. I am a JavaScript developer, not C++.

  The async programming of JavaScript is so wanderful.

- [**Mod Organizer 2 v2.3.0 +**](https://www.nexusmods.com/skyrimspecialedition/mods/6194)

  Only support MO2, not MO legency.

  I did not test old versions of Mod Organizer 2.

- **MO2 Portable instance**

  I just used MO2 Portable instance, not support non portable instance.

- No unmanaged plugins or masters, except five Vallina master

- the name of plugin not start with "\*"

## Features

### Sort mods

The mod's name determine it's priority, just use [String.prototype.localeCompare()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare), like the Windows Explorer list files by name.



![sort_mods_comparation](./docs/sort_mods_comparation.jpg)

### Sort plugins

The mod's name determine it's plugins priority.

This feature is optional, default is enable.



![sort_plugins_comparation](./docs/sort_plugins_comparation.jpg)

### Backup before sorting

Before sorting, the program will backup the modlist.txt, plugins.txt, loadorder.txt file.

The name of backup file is like modlist.txt_backup_2020-05-29_17-53-12_955.

This feature is optional, default is enable.

## Usage

1. Instanll *Node.js* and *Mod Organizer 2* first.

2. Download the latest releases and extract it.

3. Config the installation path of your MO2 portable instance

   ```javascript
   const moTwoInstallationDirectory = 'D:\\TES\\SE_Program\\Mod Organizer 2 (Archive)-6194-2-3-0';
   ```

   Change  "D:\\TES\\SE_Program\\Mod Organizer 2 (Archive)-6194-2-3-0"  to yours.

   - Use "\\\\" as path separator.

   - Ensure  it's quote by '.

   Then save.

4. Run sort.bat then will sort the selected profile.

   

![sort_done](./docs/sort_done.jpg)

5. After sorting, reload selected profile(such as switch to another profile then switch back).

## Configuration

Open `./dist/SortMod.js` when contains the following JavaScript code:

```JavaScript
const moTwoInstallationDirectory = 'D:\\TES\\SE_Program\\Mod Organizer 2 (Archive)-6194-2-3-0';
const config = {
    moTwoInstallationDirectory,
    isSortAllProfiles: false,
    isOnlySortSelectedProfile: true,
    isBackup: true,
    isSortPlugins: true
};
```



If not backup, set `isBackup` to `false`, then your will get line:

```javascript
isBackup: false,
```



Your can config that five property of `config` object. See the following TypeScript code for more infomations.

```typescript
type SortProfilesByConfigParameter = {
	/**
	 * MO2 Portable installation directory
	 * <necessity required />
	 */
	moTwoInstallationDirectory: string
	/**
	 * determine whether to sort all profiles
	 *
	 * <necessity optional />
	 *
	 * <ignoreProperties>
	 *		<condition value="true" />
	 *		<property name="isOnlySortSelectedProfile" />
	 * </ignoreProperties>
	 */
	isSortAllProfiles?: boolean
	/**
	 * determine whether to only sort selected profile
	 *
	 * <necessity optional />
	 *
	 * <propertyDependencies>
	 *     <condition value="true" />
	 *     <property name="isSortAllProfiles" value="false" />
	 * </propertyDependencies>
	 *
	 */
	isOnlySortSelectedProfile?: boolean,
	/**
	 * determine whether to backup files
	 * <necessity optional />
	 */
	isBackup?:boolean
	/**
	 * determine whether to sort plugins
	 * <necessity optional />
	 */
	isSortPlugins?: boolean
}
```




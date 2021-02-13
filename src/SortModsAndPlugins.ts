import ModOrganizerTwo, {SortProfilesByConfigParameter} from './ModOrganizerTwo'

const mo2ConfigFilePath = 'D:\\TES\\SE_Program\\Mod Organizer 2 (Archive)-6194-2-3-2\\ModOrganizer.ini'

const argObj: SortProfilesByConfigParameter = {
    mo2ConfigFilePath,
    isSortAllProfiles: false,
    isOnlySortSelectedProfile: true,
    isBackup: true,
    isSortModsByName: false,
    isSortPlugins: true
}
ModOrganizerTwo.sortProfilesByConfig(argObj)

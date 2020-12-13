import {ExecutionConfig}  from './ModManagerTwo'
import ModManagerTwo from './ModManagerTwo'

const moTwoInstallationDirectory = 'D:\\TES\\SE_Program\\Mod Organizer 2 (Archive)-6194-2-3-0'

const config: ExecutionConfig = {
	moTwoInstallationDirectory,
	isSortAllProfiles: false,
	isOnlySortSelectedProfile: true,
	isBackup: true,
	isSortPlugins: true
}
ModManagerTwo.sortProfilesByConfig(config)



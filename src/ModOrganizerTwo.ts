import path from 'path'
import ini from 'ini'
import {getSubdirectories, readFileUTF8} from './util/FSUtil'
import {getMiddle} from './util/StringUtil'
import ModOrganizerTwoProfile, {SortParameter} from './ModOrganizerTwoProfile'
import {getDirectoryName} from "./util/PathUtil";
import {Empty_Array, Empty_String} from "./util/ValueUtil";

type SortProfileBaseParameter = Omit<SortParameter, 'onFinish'>

/**
 * <functionalParameterType function="sortProfilesByConfig" />
 */
export type SortProfilesByConfigParameter = {
    /**
     * MO2 Config File Path directory
     *
     * <necessity required />
     */
    mo2ConfigFilePath: string
    /**
     * determine whether to sort all profiles
     *
     * <necessity optional />
     *
     * <ignoreProperties>
     *        <condition value="true" />
     *        <property name="isOnlySortSelectedProfile" />
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
} & SortProfileBaseParameter

// [lyne] Type1 & Type2 交叉形成的类型具有两个 Type1 和 Type2 的属性
/**
 * <functionalParameterType function="sortSelectedProfile" />
 */
export type SortProfileParameter = {
    profileDirectory: string
    onFinish?: (selectProfileName: string) => void
} & SortProfileBaseParameter

export type SortSelectedProfileParameter = Omit<SortProfileParameter, 'profileDirectory'>

/**
 * <functionalParameterType function="sortAllProfiles" />
 */
export type SortAllProfilesParameter = Omit<SortProfileParameter, 'profileDirectory'> & {
    onFinish?: (profileNames: Array<string>) => void
}




/**
 * 类 ModManager
 * 暂时只支持 Portable 模式的排序
 * 如需排序 mods 和 plugins, 应先指定 modsPath, 再指定 currentProfilePath
 */
export default class ModOrganizerTwo {

    static readonly Config_File_Name = 'ModOrganizer.ini'

    static readonly Settings_Option_Name = 'Settings'
    static readonly Mod_Directory_Property_Name = 'mod_directory'
    static readonly Profiles_Directory_Property_Name = 'profiles_directory'
    static readonly General_Option_Name = 'General'
    static readonly Selected_Profile_Property_Name = 'selected_profile'


    /**
     * 暂不使用
     * @type {boolean}
     */
    isPortableMode = true
    /**
     * MO 2 portable 的安装目录
     * 绝对路径
     * @type {string}
     *
     * 安装目录\ModOrganizer.ini 包含许多信息
     *
     * <dependencies>
     *    <method name="init" parameterQueue="[string]"/>
     * </dependencies>
     *
     * @see  ModOrganizerTwo.init
     * <see>
     *     <method name="init" parameterQueue="[string]"/>
     * </see>
     */
    installationDirectory = Empty_String
    /**
     * nod 的存放目录
     * 绝对路径
     * @type {string}
     *
     * <dependencies>
     *    <method name="init" parameterQueue="[string]"/>
     * </dependencies>
     */

    /**
     * 配置文件 'ModOrganizer.ini' 路径
     * 获取配置最终需要的是这个, 应提供 API
     * [lyne408] 必须提供仅必须参数的 API
     */
    configFilePath = Empty_String

    /**
     * mod directory 表示 存放模组的目录
     *
     * mods directory 表示存放模组的文件夹名为 mods, 则 directory 表示路径
     */
    modDirectory = Empty_String

    /**
     * profiles 目录的路径
     * 绝对路径
     * @type {string}
     *
     * <dependencies>
     *    <method name="init" parameterQueue="[string]"/>
     * </dependencies>
     */
    profilesDirectory = Empty_String

    /**
     * 存储全部 profile 名字的数组
     * @type {string}
     *
     * <dependencies>
     *    <method name="init" parameterQueue="[string]"/>
     * </dependencies>
     */
    profilesNames: Array<string> = Empty_Array

    /**
     *
     * 当前启用的(选择的) profile
     *
     *
     * @type {string}
     *
     * <dependencies>
     *    <method name="init" parameterQueue="[string]"/>
     * </dependencies>
     */
    selectedProfileName = Empty_String


    /**
     * 为 {职责类 API}
     *
     */
    mods: Array<string> = Empty_Array

    /**
     * 为 {业务类 API}
     *
     * mod 目录的 mod 名数组, 按当前 locale 文件名升序
     *
     * 便于传给多个 ModManagerTwoProfile 实例的属性 allModsSorted, 避免让每个 ModManagerTwoProfile 实例再进行 IO 操作初始化其属性 allModsSorted
     * @type {string[]}
     *
     * <dependencies>
     *    <method name="init" parameterQueue="[string]"/>
     * </dependencies>
     */
    modsSortedByName: Array<string> = Empty_Array

    /**
     * 为 {业务类 API}
     *  MO2 的按名称列出 Mods 的排序 并非用的 localeCompare()
     *
     * 获取 mod 目录的 mod 名数组, 按当前 locale 文件名升序
     *
     * MO2 应该提供这个静态方法
     *
     * ModManagerTwoProfile 必须要得到 mod directory, 才能获取有哪些 esp.
     *
     * [lyne]
     * 取名
     * getAllModsSorted(string)     OOP 里 getter 名, setter 名 不应被占用
     * generateAllModsSorted(string)
     * buildAllModsSorted(string)
     *
     * @param {string} modDirectory mod 目录
     * @return {Promise<Array<string>>}
     */
    static async getModsSortedSortedByName(modDirectory: string): Promise<Array<string>> {
        // 等价于使用当前 locale, 按文件名排序
        return (await getSubdirectories(modDirectory)).sort((a, b) => a.localeCompare(b))
    }

    /**
     * 为 {习惯性 API}
     *
     * 初始化一些属性
     *
     * 如果是 portable模式, 安装目录\ModOrganizer.ini:
     *  ```ini
     *  [Settings]
     *  mod_directory=D:/TES/SE_mods
     *  profiles_directory=D:/TES/SE_Data/profiles
     *
     *   [General]
     *   selected_profile=@ByteArray(Z_ECE_CBBE_for_ASO_Pixar)
     *  ```
     * 可据此获取所需信息.
     *
     * @type {string}
     */
    async init(mo2ConfigFilePath: string) {
        this.configFilePath = mo2ConfigFilePath
        this.installationDirectory = path.dirname(mo2ConfigFilePath)

        const fileContent = await readFileUTF8(mo2ConfigFilePath)
        const ancestorNode = ini.parse(fileContent)
        this.modDirectory = ancestorNode[ModOrganizerTwo.Settings_Option_Name][ModOrganizerTwo.Mod_Directory_Property_Name]
        console.info(`[Info]`, `Mod directory: ${this.modDirectory}`)

        this.profilesDirectory = ancestorNode[ModOrganizerTwo.Settings_Option_Name][ModOrganizerTwo.Profiles_Directory_Property_Name]
        console.info(`[Info]`, `Profiles directory: ${this.profilesDirectory}`)

        // selectedProfileValue 值为 @ByteArray({当前profile名})
        const selectedProfileValue = ancestorNode[ModOrganizerTwo.General_Option_Name][ModOrganizerTwo.Selected_Profile_Property_Name]
        this.selectedProfileName = getMiddle({
            string: selectedProfileValue,
            left: '@ByteArray(',
            right: ')'
        })
        console.info(`[Info]`, `Select profile: ${this.selectedProfileName}`)

        this.modsSortedByName = await ModOrganizerTwo.getModsSortedSortedByName(this.modDirectory)

        this.profilesNames = await getSubdirectories(this.profilesDirectory)
    }



    /**
     * 为 {职责类 API}, {低层 API}
     * @param profileDirectory
     * @param isBackup
     * @param isSortModsByName
     * @param isSortPlugins
     * @param onFinish
     */
    async sortProfile({           profileDirectory,
                                  isBackup = true,
                                  isSortModsByName = false,
                                  isSortPlugins = true,
                                  onFinish
                              }: SortProfileParameter) {

        const profile = new ModOrganizerTwoProfile()
        await profile.init({
            modDirectory: this.modDirectory,
            allModsSorted: this.modsSortedByName,
            profileDirectory
        })

        await profile.sort({
            isBackup,
            isSortModsByName,
            isSortPlugins
        })
        if (typeof onFinish === 'function') {
            onFinish(profileDirectory)
        } else {
            console.info(`[Info]`, `Profile [${getDirectoryName(profileDirectory)}] sorted!`)
        }

    }

    /**
     * 为 {业务类 API}
     * sort selected profile
     *
     * @param {boolean} isBackup  whether to backup original files
     * @param {boolean} isSortPlugins whether to sort plugins
     * @param onFilish
     * @return {Promise<void>}
     *
     * <dependencies>
     *    <method name="init" parameterQueue="[string]"/>
     * </dependencies>
     */
    async sortSelectedProfile({
                                  isBackup = true,
                                  isSortModsByName = false,
                                  isSortPlugins = true,
                                  onFinish,
                              }: SortSelectedProfileParameter) {

        /* [lyne408]
        注意:
            1. 参数默认值与低层级代码不一致时, 必须解构以重设默认值. 需要调用低层级代码时, 可读 arguments[0].
            2. 不重设置蚕食默认值, 直接调用低层级代码时, 就设 argObj 为参数 object, 不建议用 arguments[0]

        参考 sortSelectedProfile() 与 sortAllProfiles 的代码
        */
        return this.sortProfile(Object.assign({
            profileDirectory: path.resolve(this.profilesDirectory, this.selectedProfileName)
        }, arguments[0]))

    }

    /**
     * 为 {业务类 API}
     *
     * sort all profiles
     * @param {SortAllProfilesParameter} argObject
     * @return {Promise<void>}
     *
     * <dependencies>
     *    <method name="init" parameterQueue="[string]"/>
     * </dependencies>
     *
     */
    async sortAllProfiles(argObject: SortAllProfilesParameter) {

        await Promise.all(this.profilesNames.map(async (profileName) => {
            return this.sortProfile(Object.assign({
                profileDirectory: path.resolve(this.profilesDirectory, profileName),
            }, argObject))

        }))

        if (typeof argObject.onFinish === 'function') {
            argObject.onFinish(this.profilesNames)
        } else {
            console.info(`[Info]`, `All profiles sorted!`)
        }
    }

    /**
     * sort profiles by given config object
     *
     * user-friendly
     *
     * @param {string} moTwoInstallationDirectory
     * @param {boolean | undefined} isSortAllProfiles
     * @param {boolean | undefined} isOnlySortSelectedProfile
     * @param {boolean | undefined} isBackup
     * @param {boolean | undefined} isSortModsByName
     * @param {boolean | undefined} isSortPlugins
     * @return {Promise<void>}
     */
    static async sortProfilesByConfig({
                                                   mo2ConfigFilePath,
                                                   isSortAllProfiles = false,
                                                   isOnlySortSelectedProfile = true,
                                                   isBackup = true,
                                                   isSortModsByName = false,
                                                   isSortPlugins = true
                                               }: SortProfilesByConfigParameter) {
        const mo2 = new ModOrganizerTwo()
        await mo2.init(mo2ConfigFilePath)
        let sortProfileParameterObj = {
            isBackup,
            isSortPlugins,
            isSortModsByName
        }
        if (isSortAllProfiles) {
            return mo2.sortAllProfiles(sortProfileParameterObj)
        } else if (isOnlySortSelectedProfile) {
            return mo2.sortSelectedProfile(sortProfileParameterObj)
        }
    }
}


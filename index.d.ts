import { ExecutionConfig, SortSelectedProfileParameter, SortAllProfilesParameter } from './src/ModManagerTwo'

export default class ModManagerTwo {
  init (installationDirectory: string): Promise <void>
  sortSelectedProfile (isBackup: boolean, isSortPlugins: boolean, onFinish: () => void): Promise <void>
  sortAllProfiles (isBackup: boolean, isSortPlugins: boolean, onFinish: () => void): Promise <void>
  static sortProfilesByConfig (executionConfig: ExecutionConfig):Promise <void>
}

export function sortProfilesByConfig (executionConfig: ExecutionConfig): Promise <void>
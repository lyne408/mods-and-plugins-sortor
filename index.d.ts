import { ExecutionConfig, SortSelectedProfileParameter, SortAllProfilesParameter } from './src/ModManagerTwo'

export default class ModManagerTwo {
  init (installationDirectory: string): Promise <void>
  sortSelectedProfile (argObj: SortSelectedProfileParameter): Promise <void>
  sortAllProfiles (argObj: SortAllProfilesParameter): Promise <void>
  static sortProfilesByConfig (executionConfig: ExecutionConfig):Promise <void>
}

export function sortProfilesByConfig (executionConfig: ExecutionConfig): Promise <void>
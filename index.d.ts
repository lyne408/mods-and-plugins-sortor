import {
  SortSelectedProfileParameter,
  SortAllProfilesParameter,
  SortProfilesByConfigParameter,
  SortProfileParameter
} from './src/ModOrganizerTwo'

export default class ModOrganizerTwo {
  init (mo2ConfigFilePath: string): Promise <void>
  sortProfile (argObj: SortProfileParameter): Promise <void>
  sortSelectedProfile (argObj: SortSelectedProfileParameter): Promise <void>
  sortAllProfiles (argObj: SortAllProfilesParameter): Promise <void>
  static sortProfilesByConfig (argObj: SortProfilesByConfigParameter):Promise <void>
}

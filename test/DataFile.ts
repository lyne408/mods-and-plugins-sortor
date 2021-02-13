import DataFile from "../src/DataFile";

async function  test () {
    const dataFilePath = 'D:/TES/SE_mods/Y_1121_[ENB Instance Data part]_Silent Horizons - Solar Cleaner-21543-1-0_Vivid Weathers/Silent Horizons - Solar Cleaner - Vivid Weathers.esp'

    const value = await DataFile.getRecordFlagsValue(dataFilePath)
    console.log(value)
}

test ()
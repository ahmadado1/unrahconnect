// Raises Android's AsyncStorage limit from 6 MB to 50 MB (iPhone has no such limit).
// When the 6 MB box is full, every save in the app fails ("database or disk is full").
// Big data (Quran text, pages, tafsir) is stored in files; this is only a safety margin.
const { withGradleProperties } = require("expo/config-plugins")

module.exports = function withAsyncStorageSize(config, sizeMB = 50) {
  return withGradleProperties(config, cfg => {
    cfg.modResults = cfg.modResults.filter(
      item => !(item.type === "property" && item.key === "AsyncStorage_db_size_in_MB")
    )
    cfg.modResults.push({ type: "property", key: "AsyncStorage_db_size_in_MB", value: String(sizeMB) })
    return cfg
  })
}

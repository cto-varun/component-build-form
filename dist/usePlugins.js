"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = require("react");
var _merge = _interopRequireDefault(require("lodash/merge"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const normalizeExtension = extension => {
  if (typeof extension === 'string') return [extension];
  if (Array.isArray(extension)) return extension;
  return [];
};
const getPlugin = async (plugin, invoke, extensionList, setExtensionPoints) => {
  extensionList.forEach(async ext => {
    const invoked = ext ? plugin.invoke(ext) : undefined;
    try {
      if (Array.isArray(invoked) && invoked.length) {
        const [loadPlugin] = invoked;
        const loadedExtension = await loadPlugin;
        if (loadedExtension) {
          setExtensionPoints(extensionPoints => ({
            ...extensionPoints,
            extensions: (0, _merge.default)(extensionPoints.extensions, loadedExtension),
            loaded: extensionPoints.loaded + 1
          }));
        }
      }
    } catch (e) {
      console.warn(e);
      setExtensionPoints(extensionPoints => ({
        ...extensionPoints,
        errors: extensionPoints.errors + 1
      }));
    }
  });
  if (Array.isArray(invoke) && invoke.length) {
    setExtensionPoints(extensionPoints => ({
      ...extensionPoints,
      plugins: {
        instance: plugin,
        invoke
      }
    }));
  }
};
const load = async (plugin, invoke, extensions, setExtensionPoints) => {
  await getPlugin(plugin, invoke, extensions, setExtensionPoints);
};
const usePlugins = (plugin, invoke, extension, toMerge) => {
  const [extensionPoints, setExtensionPoints] = (0, _react.useState)({
    plugin: {},
    extensions: {},
    errors: 0,
    loaded: 0,
    complete: false
  });
  const [isLoading, setIsLoading] = (0, _react.useState)(true);
  const extensionList = (0, _react.useRef)(normalizeExtension(extension));
  (0, _react.useEffect)(() => {
    if (extensionList.current.length) {
      load(plugin, invoke, extensionList.current, setExtensionPoints);
    }
  }, []);
  (0, _react.useEffect)(() => {
    if (extensionPoints.errors) {
      console.warn('Some extensions failed to load. Unexpected behavior may occur.');
    }
    if (extensionPoints.loaded === extensionList.current.length && !extensionPoints.complete) {
      setExtensionPoints(extPoints => ({
        ...extPoints,
        complete: true,
        extensions: (0, _merge.default)(extPoints.extensions, toMerge)
      }));
      setIsLoading(false);
    }
  }, [extensionPoints]);
  return [extensionPoints, isLoading];
};
var _default = usePlugins;
exports.default = _default;
module.exports = exports.default;
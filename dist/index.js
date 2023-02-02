"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _form = _interopRequireDefault(require("./form"));
var _form2 = require("./form.schema");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = {
  component: _form.default,
  schema: _form2.schema,
  ui: _form2.ui
};
exports.default = _default;
module.exports = exports.default;
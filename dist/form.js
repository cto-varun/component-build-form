"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _antd = require("antd");
var _componentMessageBus = require("@ivoyant/component-message-bus");
var _componentJsx = _interopRequireDefault(require("@ivoyant/component-jsx"));
var _jsonata = _interopRequireDefault(require("jsonata"));
var _reactRouterDom = require("react-router-dom");
var _componentReactTemplate = require("@ivoyant/component-react-template");
var _usePlugins = _interopRequireDefault(require("./usePlugins"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
/* eslint-disable complexity */

// import FormBuilder from 'ivoyant-form-builder';

// This is the new updated JSX Template

const getContextData = (workflow, requestTopic, transform) => {
  let responseData = {};
  _componentMessageBus.MessageBus.request(requestTopic, {
    header: {
      registrationId: workflow,
      workflow
    },
    body: {
      transform
    }
  }).subscribe(respData => {
    responseData = respData;
  }).unsubscribe();
  return responseData;
};
const handleResponse = (workflow, successStates, errorStates, form, submissionValidation, id, parentState, parentSetState, payload) => (subscriptionId, topic, eventData, closure) => {
  let responseData = {};
  const isSuccess = successStates.includes(eventData.value);
  const isError = errorStates.includes(eventData.value);
  if (isSuccess || isError) {
    const response = eventData?.event?.data?.request?.response;
    const responseMappingError = eventData?.event?.data;
    if (isError && responseMappingError) {
      responseData = responseMappingError;
    } else if (response) {
      responseData = {
        ...JSON.parse(response)
      };
    }
    if (submissionValidation && submissionValidation.errors) {
      const fields = [];
      (submissionValidation.errors || []).forEach(error => {
        if (form.getFieldValue(error.key) === error.value) {
          fields.push(error.set);
        }
      });
      if (fields.length) {
        form.setFields(fields);
        closure.formStatusSetter({
          status: 'error',
          response: {
            id,
            ...responseData,
            payload,
            responseData,
            formStatus: 'error',
            parentSetState,
            parentState
          }
        });
      }
    }
    closure.formStatusSetter({
      status: isSuccess ? 'success' : 'error',
      response: {
        ...responseData,
        payload,
        id,
        parentSetState,
        parentState,
        responseData,
        formStatus: isSuccess ? 'success' : 'error',
        formValues: {
          ...form.getFieldsValue()
        }
      }
    });

    // Unsubscribe for this event from Messagebus
    _componentMessageBus.MessageBus.unsubscribe(workflow);
  }
};
const collector = workflowConfiguration => (payload, form, _ref) => {
  let [, setFormStatus] = _ref;
  const {
    datasource,
    workflow,
    initialize = true,
    submitEvent = 'SUBMIT',
    requestMapping,
    responseMapping,
    successStates = [],
    errorStates = [],
    submissionValidation,
    id,
    parentState,
    parentSetState
  } = workflowConfiguration;
  _componentMessageBus.MessageBus.subscribe(workflow, 'WF.'.concat(workflow).concat('.STATE.CHANGE'), handleResponse(workflow, successStates, errorStates, form, submissionValidation, id, parentState, parentSetState, payload), {
    form,
    formStatusSetter: setFormStatus
  });
  if (initialize) {
    _componentMessageBus.MessageBus.send('WF.'.concat(workflow).concat('.INIT'), {
      header: {
        registrationId: workflow,
        workflow,
        eventType: 'INIT'
      }
    });
  }
  const request = {
    body: payload.data,
    params: payload.params
  };
  if (payload.decisionData) {
    request.decisionData = payload.decisionData;
  }
  _componentMessageBus.MessageBus.send('WF.'.concat(workflow).concat('.').concat(submitEvent), {
    header: {
      registrationId: workflow,
      workflow,
      eventType: submitEvent
    },
    body: {
      datasource,
      request,
      requestMapping,
      responseMapping
    }
  });
};
const template = (data, _ref2) => {
  let {
    parentState,
    parentSetState,
    parentConstants
  } = _ref2;
  return {
    jsxTemplate: {
      component: _componentJsx.default.component,
      metaConverter: field => ({
        ...field,
        widgetProps: {
          component: {
            params: {
              state: field.state,
              constants: {
                ...field.constants,
                parentConstants
              },
              effects: field.effects,
              render: field.template,
              import: field.import,
              delimiter: field.delimiter || '%'
            }
          },
          parentState,
          parentSetState,
          data: {
            data
          }
        }
      })
    }
  };
};
const getSecondaryDatasources = function (secondaryDatasources) {
  let datasources = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return secondaryDatasources.reduce((acc, src) => {
    const datasource = datasources[src];
    if (datasource) {
      acc[src] = {
        ...datasource
      };
    }
    return acc;
  }, {});
};
const sendWorkflowEvent = (workflow, event, data) => {
  _componentMessageBus.MessageBus.send('WF.'.concat(workflow).concat('.').concat(event), {
    header: {
      registrationId: workflow,
      workflow,
      eventType: event
    },
    body: data || {}
  });
};
const Form = _ref3 => {
  let {
    properties,
    plugin,
    parentProps,
    component: {
      id
    },
    delayedData = {},
    parentSetState,
    parentState,
    parentConstants,
    data: {
      data
    }
  } = _ref3;
  const {
    invoke,
    extension,
    datasource,
    datasourceExpr,
    workflow,
    initialize = true,
    submitEvent = 'SUBMIT',
    responseMapping,
    requestMapping,
    successStates,
    errorStates,
    submissionValidation,
    contextTransform,
    requestContext = false,
    secondaryDatasources = []
  } = properties;
  const location = (0, _reactRouterDom.useLocation)();
  const {
    context: templateContext,
    dispatch
  } = (0, _componentReactTemplate.useTemplateContext)();
  const dataToMerge = {
    parserPresets: {
      // put variables here, like CTN, etc
      data,
      templateContext,
      dispatch,
      parentState,
      parentSetState,
      parentConstants,
      routeData: location?.state?.routeData || {},
      sendEvent: function (event, data) {
        let isWorkflow = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
        isWorkflow ? sendWorkflowEvent(workflow, event, data) : _componentMessageBus.MessageBus.send(event, data);
      },
      delayedData,
      datasources: getSecondaryDatasources(secondaryDatasources, parentProps?.datasources),
      context: requestContext ? getContextData(workflow, 'WF.'.concat(workflow).concat('.STATE.REQUEST'), contextTransform) : {}
    },
    widgetPresets: {
      ...template(data, {
        parentState: {
          ...parentState,
          ...templateContext,
          dispatch
        },
        parentSetState,
        parentConstants
      })
    }
  };
  const [userExtensions, isLoading] = (0, _usePlugins.default)(plugin, invoke, extension, dataToMerge);
  const collectionCallback = (0, _react.useCallback)(collector({
    datasource: parentProps?.datasources?.[datasource || (datasourceExpr ? (0, _jsonata.default)(datasourceExpr).evaluate({
      data,
      routeData: location?.state?.routeData || {}
    }) : '')],
    workflow,
    requestMapping,
    responseMapping,
    successStates,
    errorStates,
    initialize,
    submitEvent,
    submissionValidation,
    id,
    parentState: {
      ...parentState,
      ...templateContext,
      dispatch
    },
    parentSetState
  }), []);
  if (isLoading) {
    return /*#__PURE__*/_react.default.createElement(_antd.Spin, {
      tip: "Loading"
    });
  }
  return (
    /*#__PURE__*/
    // <FormBuilder
    //     {...userExtensions}
    //     config={properties}
    //     collectionCallback={collectionCallback}
    // />
    _react.default.createElement(_react.default.Fragment, null)
  );
};
var _default = /*#__PURE__*/_react.default.memo(Form);
exports.default = _default;
module.exports = exports.default;
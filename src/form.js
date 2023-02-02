/* eslint-disable complexity */
import React, { useCallback } from 'react';
import { Spin } from 'antd';
// import FormBuilder from 'ivoyant-form-builder';
import { MessageBus } from '@ivoyant/component-message-bus';
import TemplateJSX from '@ivoyant/component-jsx'; // This is the new updated JSX Template
import jsonata from 'jsonata';
import { useLocation } from 'react-router-dom';
import { useTemplateContext } from '@ivoyant/component-react-template';
import usePlugins from './usePlugins';

const getContextData = (workflow, requestTopic, transform) => {
    let responseData = {};

    MessageBus.request(requestTopic, {
        header: {
            registrationId: workflow,
            workflow,
        },
        body: {
            transform,
        },
    })
        .subscribe((respData) => {
            responseData = respData;
        })
        .unsubscribe();

    return responseData;
};

const handleResponse =
    (
        workflow,
        successStates,
        errorStates,
        form,
        submissionValidation,
        id,
        parentState,
        parentSetState,
        payload
    ) =>
    (subscriptionId, topic, eventData, closure) => {
        let responseData = {};
        const isSuccess = successStates.includes(eventData.value);
        const isError = errorStates.includes(eventData.value);
        if (isSuccess || isError) {
            const response = eventData?.event?.data?.request?.response;
            const responseMappingError = eventData?.event?.data;

            if (isError && responseMappingError) {
                responseData = responseMappingError;
            } else if (response) {
                responseData = { ...JSON.parse(response) };
            }

            if (submissionValidation && submissionValidation.errors) {
                const fields = [];
                (submissionValidation.errors || []).forEach((error) => {
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
                            parentState,
                        },
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
                        ...form.getFieldsValue(),
                    },
                },
            });

            // Unsubscribe for this event from Messagebus
            MessageBus.unsubscribe(workflow);
        }
    };

const collector =
    (workflowConfiguration) =>
    (payload, form, [, setFormStatus]) => {
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
            parentSetState,
        } = workflowConfiguration;
        MessageBus.subscribe(
            workflow,
            'WF.'.concat(workflow).concat('.STATE.CHANGE'),
            handleResponse(
                workflow,
                successStates,
                errorStates,
                form,
                submissionValidation,
                id,
                parentState,
                parentSetState,
                payload
            ),
            { form, formStatusSetter: setFormStatus }
        );
        if (initialize) {
            MessageBus.send('WF.'.concat(workflow).concat('.INIT'), {
                header: {
                    registrationId: workflow,
                    workflow,
                    eventType: 'INIT',
                },
            });
        }

        const request = {
            body: payload.data,
            params: payload.params,
        };

        if (payload.decisionData) {
            request.decisionData = payload.decisionData;
        }

        MessageBus.send(
            'WF.'.concat(workflow).concat('.').concat(submitEvent),
            {
                header: {
                    registrationId: workflow,
                    workflow,
                    eventType: submitEvent,
                },
                body: {
                    datasource,
                    request,
                    requestMapping,
                    responseMapping,
                },
            }
        );
    };

const template = (data, { parentState, parentSetState, parentConstants }) => ({
    jsxTemplate: {
        component: TemplateJSX.component,
        metaConverter: (field) => ({
            ...field,
            widgetProps: {
                component: {
                    params: {
                        state: field.state,
                        constants: { ...field.constants, parentConstants },
                        effects: field.effects,
                        render: field.template,
                        import: field.import,
                        delimiter: field.delimiter || '%',
                    },
                },
                parentState,
                parentSetState,
                data: {
                    data,
                },
            },
        }),
    },
});

const getSecondaryDatasources = (secondaryDatasources, datasources = {}) => {
    return secondaryDatasources.reduce((acc, src) => {
        const datasource = datasources[src];
        if (datasource) {
            acc[src] = { ...datasource };
        }
        return acc;
    }, {});
};

const sendWorkflowEvent = (workflow, event, data) => {
    MessageBus.send('WF.'.concat(workflow).concat('.').concat(event), {
        header: {
            registrationId: workflow,
            workflow,
            eventType: event,
        },
        body: data || {},
    });
};

const Form = ({
    properties,
    plugin,
    parentProps,
    component: { id },
    delayedData = {},
    parentSetState,
    parentState,
    parentConstants,
    data: { data },
}) => {
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
        secondaryDatasources = [],
    } = properties;
    const location = useLocation();
    const { context: templateContext, dispatch } = useTemplateContext();
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
            sendEvent: (event, data, isWorkflow = true) => {
                isWorkflow
                    ? sendWorkflowEvent(workflow, event, data)
                    : MessageBus.send(event, data);
            },
            delayedData,
            datasources: getSecondaryDatasources(
                secondaryDatasources,
                parentProps?.datasources
            ),
            context: requestContext
                ? getContextData(
                      workflow,
                      'WF.'.concat(workflow).concat('.STATE.REQUEST'),
                      contextTransform
                  )
                : {},
        },
        widgetPresets: {
            ...template(data, {
                parentState: {
                    ...parentState,
                    ...templateContext,
                    dispatch,
                },
                parentSetState,
                parentConstants,
            }),
        },
    };

    const [userExtensions, isLoading] = usePlugins(
        plugin,
        invoke,
        extension,
        dataToMerge
    );

    const collectionCallback = useCallback(
        collector({
            datasource:
                parentProps?.datasources?.[
                    datasource ||
                        (datasourceExpr
                            ? jsonata(datasourceExpr).evaluate({
                                  data,
                                  routeData: location?.state?.routeData || {},
                              })
                            : '')
                ],
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
                dispatch,
            },
            parentSetState,
        }),
        []
    );

    if (isLoading) {
        return <Spin tip="Loading" />;
    }

    return (
        // <FormBuilder
        //     {...userExtensions}
        //     config={properties}
        //     collectionCallback={collectionCallback}
        // />
        <></>
    );
};

export default React.memo(Form);

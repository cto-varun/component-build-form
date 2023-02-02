export const schema = {
    title: 'Form settings',
    type: 'object',
    required: [],
    properties: {
        globalHeader: {
            title: 'Global header HTML template',
            type: 'string',
            default: '',
        },
        template: {
            title: 'HTML template',
            type: 'string',
            default: '',
        },
        styles: {
            title: 'CSS Styles',
            type: 'string',
            default: '',
        },
    },
};

export const ui = {
    globalHeader: {
        'ui:widget': 'textarea',
    },
    template: {
        'ui:widget': 'textarea',
    },
    styles: {
        'ui:widget': 'textarea',
    },
};

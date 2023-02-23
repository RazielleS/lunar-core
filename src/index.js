import {defaultFieldResolver} from 'graphql';
import {
  forEachField,
  addMockFunctionsToSchema as graphqlToolsAddMockFunctionsToSchema,
} from 'graphql-tools';
import {store} from './store';
import combineMocks from './combineMocks';
import compose from './compose';

const addToContext =
  options =>
  resolver =>
  (root, args, context = {}, info) => {
    const extendedContext = Object.assign(
      Object.create(Object.getPrototypeOf(context)),
      context,
      options
    );
    return resolver(root, args, extendedContext, info);
  };

export const addMockFunctionsToSchema = ({
  schema,
  mocks: mocksIn = {},
  preserveResolvers = false,
}) => {
  const mocks = Array.isArray(mocksIn) ? combineMocks(schema, ...mocksIn) : mocksIn;

  graphqlToolsAddMockFunctionsToSchema({schema, mocks, preserveResolvers});

  const {clear, find, reset, track} = store(schema);

  const MutationTypeName = schema.getMutationType().name;

  forEachField(schema, (field, typeName) => {
    const wrappers = [addToContext({clear, find, reset})];

    if (typeName !== MutationTypeName) {
      wrappers.unshift(track);
    }

    field.resolve = compose(...wrappers)(field.resolve);
  });
};

export const removeMockFunctionsFromSchema = ({schema}) => {
  const {reset} = store(schema);

  reset();

  forEachField(schema, field => {
    field.resolve = defaultFieldResolver;
  });
};

export {default as combineMocks} from './combineMocks';

const self = class {

};
module.exports = self;

const axios = require('axios');
const R = require('ramda');
const isEmpty = require('lodash/isEmpty');
const Result = require('folktale/result');
const { pipeAwait } = require('../ramda/pipe');
const { trace } = require('../ramda/trace');
const {
  isJsonApi,
} = require('../json_api/utils');

const extractAxiosData = (axiosRes) => axiosRes.data;
const extractDataFromServerData = (axiosData) => axiosData;
const encodeURIComponentJSON = (jsonData) => encodeURIComponent(JSON.stringify(jsonData));

const doesConfigContainDataProp = R.curry(
  (config) => R.has('data', config),
);


/**
 * Add data property to request config if appropiate
 * @param {Object|null} data - data to send in request body
 * @return {Object}  updated request config
 */
const addDataToConfig = R.curry(
  (config) => {
    if (doesConfigContainDataProp(config)) {
      const isConfigJsonApiData = isJsonApi(config);
      if (isConfigJsonApiData) {
        return {
          data: config,
        };
      }
      return config;
    }
    // does not contain data, the config is the data
    return {
      data: config,
    };
  },
);
/**
 * Set value for withCredentials prop
 * @param  {boolean} withCredentials - value of withCredentials prop
 * @param  {Object}  axiosRequestConfig - current axios request config
 * @return {Object} updated axios request config with withCredentaisl property value set
 */
const setWithCredentialsProp = R.curry((withCredentials, axiosRequestConfig) => (
  R.mergeLeft(
    { withCredentials },
    axiosRequestConfig,
  )
));

/**
 * Add auth token to request if the server route is secured route
 * @param {boolean}  isRouteSecure - indicates the server route is secured or not
 * @param {string}   authToken - auth token for authrization
 * @param {Object}   config - current request config
 * @return {Object} updated request config
 */
const addAuthorizationToConfig = R.curry(
  (isRouteSecure, authToken, axiosRequestConfig) => {
    if (isRouteSecure) {
      return R.mergeLeft(axiosRequestConfig, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    }

    return axiosRequestConfig;
  },
);

/**
 * Prepare the config for axios request
 * @param  {string} url - route url
 * @param  {Object} config - data to prepare axios request config
 * @return {Object} axios request config
 */
const configureAxiosRequest = R.curry((config) => {
  const {
    authToken,
    isRouteSecure,
    withCredentials,
  } = config;
  return R.pipe(
    // omit them because they don't belong to axios config
    R.omit(
      ['isRouteSecure', 'authToken'],
    ),
    addDataToConfig,
    addAuthorizationToConfig(isRouteSecure, authToken),
    setWithCredentialsProp(withCredentials),
  )(config);
});

/**
 * Handle axios request
 * @param  {string} method <get, post, put, patch,..> - all axios's method
 * @param  {string} url - api endpoint
 * @param  {Object} config contains data and other axios configs - similar
 * to axios object but doesnot contain url property
 * @return {Object} axios's response object
 * Note that in many cases we only need to pass data,
 * that is why we check doesConfigContainData
 */
const createAxiosRequest = R.curry(
  async (method, url, config) => {
    const axiosRequestConfig = configureAxiosRequest(config);
    const res = await axios(R.mergeLeft(
      { method, url },
      axiosRequestConfig,
    ));
    return res;
  },
);

// because many get request only need url, so we flip it
const axiosGet = R.curry(
  async (url, config) => pipeAwait(
    createAxiosRequest('get', url),
    extractAxiosData,
  )(config),
);
const axiosPost = R.curry(
  async (url, config) => pipeAwait(
    createAxiosRequest('post', url),
    extractAxiosData,
  )(config),
);
const axiosPut = R.curry(
  async (url, config) => pipeAwait(
    createAxiosRequest('put', url),
    extractAxiosData,
  )(config),
);
const axiosPatch = R.curry(
  async (url, config) => pipeAwait(
    createAxiosRequest('patch', url),
    extractAxiosData,
  )(config),
);
const axiosDelete = R.curry(
  async (url, config) => pipeAwait(
    createAxiosRequest('delete', url),
    extractAxiosData,
  )(config),
);

self.extractDataFromServerData = extractDataFromServerData;
self.encodeURIComponentJSON = encodeURIComponentJSON;
self.axiosGet = axiosGet;
self.axiosPost = axiosPost;
self.axiosPut = axiosPut;
self.axiosPatch = axiosPatch;
self.axiosDelete = axiosDelete;
self.addAuthorizationToConfig = addAuthorizationToConfig;
self.setWithCredentialsProp = setWithCredentialsProp;

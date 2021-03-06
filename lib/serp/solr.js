'use strict';

const debug = require('debug')('stare.js:server/serp/solr');
const rp = require('request-promise');
const fs = require('fs');

const BASE_URL = global.stareOptions.solr.baseUrl;

/**
 * Get the SERP from ElasticSearch and returns an object with the StArE.js standard format.
 *
 * @async
 * @param {string} query The search query.
 * @param {number} pageNumber Number of the SERP to get.
 * @returns {Promise} Promise object with the standarized StArE.js formatted SERP response from ElasticSearch.
 */
function getResultPages(query, pageNumber) {

  let queryParams = {
    from: (pageNumber - 1) * global.stareOptions.resultsPerPage,
    rest_total_hits_as_int: true,
    size: global.stareOptions.resultsPerPage,
    track_scores: true,
    track_total_hits: true
  };

  let queryString = Object.keys(queryParams).map(key => key + '=' + queryParams[key]).join('&');

  return new Promise((resolve, reject) => {
    let searchUrl = `${BASE_URL}/${_INDEX}/_search?q=${query}&${queryString}`;
    debug(`Search url [${searchUrl}]`);
    rp({
      uri: searchUrl,
      json: true
    })
      .then(
        solrResult => {
          let formattedResponse = {
            totalResults: solrResult.hits.total,
            searchTerms: '',
            numberOfItems: solrResult.hits.hits.length,
            startIndex: queryParams.from + 1,
            documents: []
          };

          // Extract the documents relevant info for Stare.js
          formattedResponse.documents = solrResult.hits.hits.map(item => ({
            title: item[_SOURCE][TITLE_PROPERTY] || '',
            link: `${BASE_URL}/${item._index}/${item._type}/${item._id}`,
            snippet: item[_SOURCE][SNIPPET_PROPERTY] || '',
            image: item[_SOURCE][IMAGE_PROPERTY] || ''
          }));

          resolve(formattedResponse);
        },
        err => {
          reject(err);
        })
      .catch(err => {
        reject(err);
      });
  });
}

module.exports = exports = getResultPages;

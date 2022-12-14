#! /usr/bin/env node

const { default: axios } = require('axios');
const axiosRetry = require('axios-retry');
const moment = require('moment');
const Analytics = require('analytics-node');
const uniqid = require('uniqid');

axiosRetry(axios, {
  retries: 100,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition(error) {
    return error.response && error.response.status === 429;
  },
  onRetry: () => {
    console.log('retrying...');
  },
});

module.exports = async (event = {}) => {
  if (!process.env.DEV_API_KEY) {
    console.error('Dev API Key is required. Make sure to add it in the environment variables');
    process.exit(0);
  }

  if (!process.env.DEV_ORG_ID) {
    console.error('Dev Organization ID is required. Make sure to add it in the environment variables');
    process.exit(0);
  }

  if (!process.env.DEV_ORG_NAME) {
    console.error('Dev Organization Name is required. Make sure to add it in the environment variables');
    process.exit(0);
  }
  if (!process.env.SEGMENT_API_KEY) {
    console.error('Segment API Key is required. Make sure to add it in the environment variables');
    process.exit(0);
  }
  const analytics = new Analytics(process.env.SEGMENT_API_KEY);
  const debug = process.env.DEBUG === 'true' || process.env.DEBUG === true;

  // retrieve all organizations
  try {
    const { data: articles } = await axios.get(`https://dev.to/api/organizations/${process.env.DEV_ORG_NAME}/articles?per_page=1000`);
    console.log(`Retrieved ${articles.length} articles`);
    // TODO this is for testing purposes. It should be changed to be just for the current day.
    let startDate = moment(event?.startDate);
    let endDate = event && event.endDate ? moment(event.endDate) : startDate.subtract(1, 'day');

    // format dates
    startDate = startDate.format('YYYY-MM-DD');
    endDate = endDate.format('YYYY-MM-DD');

    let totalPageViews = 0;
    for (let j = 0; j < articles.length; j++) {
      const article = articles[j];
      const { data: analyticsData } = await axios
        .get(`https://dev.to/api/analytics/historical?start=${startDate}&end=${endDate}&organization_id=${process.env.DEV_ORG_ID}&article_id=${article.id}`, {
          headers: {
            'api-key': process.env.DEV_API_KEY,
          },
        });
      const analyticsDates = Object.keys(analyticsData);
      for (let z = 0; z < analyticsDates.length; z++) {
        const analyticsDate = analyticsDates[z];
        if (analyticsData[analyticsDate].page_views.total === 0) {
          continue;
        }
        totalPageViews += analyticsData[analyticsDate].page_views.total;
        console.log(`Pushing ${analyticsData[analyticsDate].page_views.total} views on ${analyticsDate} for for "${article.title}"...`);
        for (let i = 0; i < analyticsData[analyticsDate].page_views.total; i++) {
          if ((!event || !event.testing) && !debug) {
            analytics.page({
              anonymousId: uniqid(),
              properties: {
                path: article.path,
                title: article.title,
                url: article.url,
                canonical_url: article.canonical_url,
              },
              timestamp: moment(analyticsDate).add(i, 'seconds').toDate(),
            });
          }
        }
      }
    }
    console.log(`Pushed ${totalPageViews} in total.`);
  } catch (e) {
    console.error(e);
  }
};

# Article Analytics Lambda Function

This package holds a Lambda function responsible for collecting article analytics.

## Setup

### Install Dependencies

After cloning the repo, install the dependencies with NPM:

```bash
npm install
```

### Add Environment Variables

Rename `.env.template` and set the necessary environment variables.

## Dev.to Analytics

Dev.to analytics retrieves all articles in an organization. Then, it retrieves the views of the articles from the previous day. If `DEBUG` is set to `false` or `testing` is not passed in the event in AWS or is set to `false`, the views will be recorded in Segment.

## Testing

To test the script locally, run:

```bash
npm run test
```

During testing, the script will only retrieve the analytics from Dev.to and logs them into the terminal. No data will actually be pushed into Segment.


# BRM (Business Rules Management) App

This app is a tool for authoring and testing/simulating business rules. It was made for SDPR's Business Rules Engine. It is a [Next.js](https://nextjs.org/) project that makes use of a custom fork of the [GoRules JDM Editor](https://github.com/gorules/jdm-editor) (located at https://github.com/bcgov/jdm-editor).

## Requirements

This project current depends on the API provided by the [brm-backend](https://github.com/bcgov/brm-backend) project. You'll have to set an environment variable of `NEXT_PUBLIC_SERVER_URL` pointing to the URL of that when it is up and running (like `http://localhost:3000`).

It also requires you to set up an integration with the github repo you are using to store and manage the rules. To do this you must set the `NEXT_PUBLIC_GITHUB_REPO_URL` and `NEXT_PUBLIC_GITHUB_REPO_OWNER` environment variables

Additionally, there is the following optional functionality that can be set up:
1. Set up integration for rule input/output values. This is achieved via an API provided by the [klamm](https://github.com/bcgov/klamm) project. You'll have to set an environment variable of `NEXT_PUBLIC_KLAMM_URL` pointing to the url and endpoint for the business rules set of information (like `http://localhost/bre`).
2. Set the name and description of your app/project via `NEXT_PUBLIC_APP_NAME` and `NEXT_PUBLIC_APP_DESCRIPTION` environment variables
3. Set if the deployment is in development or not (this will add a banner to the top of the app indicating this) by setting the `NEXT_PUBLIC_IN_PRODUCTION` environment variable to true or false.

## Getting it running

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) with your browser.

## Code Formatting

We use [Prettier](https://prettier.io/) to automatically format code in this project. The configuration can be found in the `.prettierrc` file.

For the best experience, we recommend installing the following editor plugins:

- **Prettier – Code formatter**
- **Formatting Toggle** (to easily enable/disable formatting when needed)

## CI/CD Pipeline

This project uses **GitHub Actions** for CI/CD workflows, which are defined in the `.github/workflows` folder. The following processes are currently in place:

- **Automated testing**: On every pull request and on merges to the `dev` or `main` branches, Jest unit tests and ESLint checks are automatically run.
- **Docker image build**: When changes are merged into `dev` or `main`, a Docker image is built and pushed to the GitHub Container Registry at `ghcr.io/bcgov/brm-app`.
- **Deployment**: After the image is built, it is deployed to the appropriate OpenShift environments. These environments are linked via project secrets configured in the repository.

More information about the deployment pipeline is available [here](https://knowledge.social.gov.bc.ca/successor/bre/devops-pipeline).

## Technical Overview

### Stack
- **Language:** TypeScript
- **Framework:** [Next.js](https://nextjs.org/) with the [App router](https://nextjs.org/docs/app)
- **Unit Testing:** Jest + React Testing Library. Testing files are stored next to the components they are testing (with a `.test.ts` suffix).
- **Linting/Formatting:** ESLint, Prettier
- **Styling:** [Ant Design](https://ant.design/). Chosen in order to align with the JDM Editor's styling.
- **Logging:** Pino
- [**JDM Editor:**](https://github.com/gorules/jdm-editor) Open source library for editing GoRules' rules. This is at the core of our application. We have a custom fork of it. You can read more about working with our custom JDM Editor fork [here](https://knowledge.social.gov.bc.ca/successor/bre/jdm-editor).

### Project Structure
| Directory         | Details           |
| ----------------- | ----------------- |
| app               | The Next.js app. It uses the [App router](https://nextjs.org/docs/app). Any directory here not mentioned below acts as a route such as `/admin`, `/errors`, `/map`, and `/rule`. Anything pertaining only to those routes should be stored within those directories/subdirectories. Anything re-used across the project should be stored in the relevant directory mentioned below. |
| app/components    | Reusable UI components. Any component used across multiple pages should live here.  |
| app/contstants    | Global project constants |
| app/hooks         | Custom React hooks |
| app/styles        | Global styles |
| app/types         | Global project types |
| app/utils         | Util files used across the project, mostly focused on things like API calls |
| .github/workflows | CI/CD Pipeline Github Actions |
| helm              | Charts for deploying to OpenShift |


## How to Contribute

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## License
```
Copyright 2024 Province of British Columbia

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at 

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
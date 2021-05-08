This is a temporary fix for the offline deployment of the Source Academy Autograder via serverless-offline.

### Setup Instructions
1. Install the serverless framework (see the serverless quick start guide [here](https://www.npmjs.com/package/serverless)).
2. Clone this repository and install the packages via `yarn install`.
3. Make the following changes to the config of the Source Academy backend (from the `cadet` repo)
    - under `dev.secrets.exs`, change the autograder lambda_name to `"autograder-dev-runAll"`
    - under `config.exs`, add the following lines to the ExAWS config
      ```  
      lambda: [
        scheme: "http://",
        host: "localhost",
        port: "3002",
      ],
      ```
4. Run `serverless offline --allowCache` in this `autograder-offline` directory, to start the offline Lambda on `localhost:3002`
5. Start the backend normally via `mix phx.server`.
6. Test out the autograder feature on a valid set of private testcases to make sure it works as expected.
    - 'Complete' an open assessment (that has private testcases configured properly in the uploaded XML file!) and click on the `Finalize Submission` button.
    - Navigate to the `Grading` tab in the top white navbar (while logged in as a 'staff' or 'admin')
    - Check the 'Grade' column. It should correctly reflect the results of the autograder

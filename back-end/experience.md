- 04/06/26

Today I made the build runner up until where user put a zip file and i extract it in my backend and run their project

Here is the flow

First user give a zip file
then i check for weather that zip file is valid or not

Then I generate a deployment Id which would be the name of the folder where i will put that zip file

After that I create some folder along with the folder with the deployment Id inside the deployments folder
Inside the deployment Id folder I then write the zip file
then extract the zip file inside the source folder under that deploymentId folder

I also imported exec which will run some command in the terminal which i would ask him to run.
I also convert it into a promisify through the util lib
cause raw exec uses callback which is too ugly and difficult to understand
then
I ran npm install inside the source folder of the extracted zip file user had given me

Then created a child process cause when i asked it why can't i just run the npm run dev in the execpromise it was saying that if i do that then it will not return from the promise as it is a long running process and the browser will not get any response so
we created a spawn a child which create a another terminal let's say and run the npm run dev inside that folder then it is successfully running the user's project

- 05/06/26

Today I first Check for package.json file to the user's given zip file
if there is not json file I return with error

Now I will Remove the exec promise cause exec promise will actually first fully run the install then returns once it is finished
on the other hand after spawning a child it will giving all the response along the way

Created a promisified version to run command very easily
Now i am moving from using npm run dev which is a infinite running process which can also be called as a service to only build the user's project for now then later using docker and all.

- 06/06/26

Yesterday I also modified some logs so that it is easy to understand what process is going on.

Now checking the type of project by searching for react, next dependencies in package.json file after reading it through fs.readFileSync

- 07/06/26

So alot of things would be removed and add/changed by today
But there is a reason for that
first better readability as well as easy to understand what happening

First creating a start building function where everything will be done related to building

- 08/06/26

So Continuing from yesterday here is the workflow
After creating the root file I am saving the buffer zip file send by the user
then returning the user about the deployment id at the same time starting the building
where i check for the package.json file if there is not any throwing error

Anyway cut to the long story short I transfered the building the project into a seperate function
also made some resuable functions like creating file
getting all deployments paths
Updating status function
Also added a status.json file to check for the status.
I will cut the connection with the frontend after status got success or failed

- 09/06/26

Today made the frontend to show logs and status
at the same time implemented react router dom

In backend made a route for sending the logs and status to the frontend

- 10/06/26

Everything had done i guess
Like user giving me a zip file I made some checks and save the zip file in the deployments folder
Then start building the project after the sending the deployment id
While doing so I also made some checks and build the project

Now its time to implement DOCKER into it.
Let's go

-- Future Addings in the acutal vercel clone project
`Meta Data json file in each project`

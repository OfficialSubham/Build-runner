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

Okay before implementing docker I had implemented
Sending static files to user in the deployment route of
the backend port

http://localhost:3000/deployed/:deploymentId/

also get some troubleshooting about sending the assets

what I had done is
Taken the deployment id from the url
then creating the distpath for that project
after that i am sharing that using express.static

The reason I understand for the usage of express.static is
when that file would get requested by the browser I will not able to know the file name to share
so by using the express.static
Any file requested under that route would be search under dist
and will get send to the user

I will do this next `Adding a fallback `
this will help to share the index.html file for the route based project
cause when the project is route based i will not send the files we wanted
so the fallback will just send I guess the main file for every route
JS will do its work

- 12/06/26

Learnings :

    > Before implementing docker i tried to implement a route based react project but on doing so I find out that project is not understanding the route as if it is nested
    > The problem I am facing is that the fallback is getting hit
    but the route is not the one we need in order to fetch the data
    so I am deciding to move to docker

    > So now we know how to server single page applications (SPA)

Moving on to docker
let's get cracking

- 13/06/26

I guess I had written this before but still
the reason for using spawn instead of promisified version of exec
is that exec will not return the stream of logs it will return once the whole function
got finished where as spawn return logs live

Learned spawn is a asyncronous process and there is no use of trycatch cause catch block never runs
as we are not waiting while doing the work

The thing I am currently doing is sending the outputs to each client with the same deployment Id
which is actually needed in vercel clone not in this build runner project so i commented it out

we should always close the logstream
removed network=none from the docker cause we are unable to install
packages

we later improved it by only allowing downloads from npm registry and github
else would not be allowed cause user can send malicious things

- 14/06/26

I implemented serving files mostly static files through subdomains

I learned about how do i actually create subdomains and serve files related to that
I actually thought this to be difficult but it is pretty easy
first in your dns provider you have to specify something like this
\*.mydomain.com/ to catch routes

then in your server at last put a app.use
where you fetch the subdomains and serve files related to that

at last because it will have different route so I have to do this /api/project route to be handle with a different handler and rest of the subdomains thing with different handler

here is the subdomain work flow  
i am fetching the subdomain then moving on to the next route

then again a middleware which will send all the static files asked by browser
from the dist folder

then a get fallback which will only send the html file whatever it is being asked for

Another thing faced is before this I was doing route base deployment
like deployed/projectId/blah/blah/blah

there i need base as ./ cause i want the js files to be send from that url
but now as i currently have subdmains so every file has its own root route
now I have to use / and base in vite.config.ts

so when it was ./ it was going with the continuation of the route but now it is
going from the root so it is asking to give the js file script which is in the index.html from the root of the dist that's it.

- 16/06/26

Now its time to move on to long running contianers

-- Future Addings in the acutal vercel clone project
`Meta Data json file in each project`

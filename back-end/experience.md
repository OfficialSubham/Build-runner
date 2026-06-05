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

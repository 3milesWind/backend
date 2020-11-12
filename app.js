const app = require("express")();

let port = 3000;

app.listen(port, () => {
  console.log("listening at  http://localhost:" + port);
});

app.use("/users", require("./routers/users"));
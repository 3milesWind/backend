const app = require("express")();

let port = 1234;

app.listen(port, () => {
  console.log("listening at  http://localhost:" + port);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/users", require("./router/users"));

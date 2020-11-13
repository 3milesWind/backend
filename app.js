const app = require("express")();

let port = 3000;

app.listen(port, () => {
  console.log("listening at  http://localhost:" + port);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/users", require("./router/users"));

const app = require("express")();

app.use(require('cors')());

let port = 3000;

app.listen(port, () => {
  console.log("listening at  http://localhost:" + port);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/users", require("./router/users"));
app.use('/posts', require('./router/posts'));

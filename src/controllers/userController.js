const db = require("../database/models");
const bcryptjs = require("bcryptjs");
const { validationResult } = require("express-validator");
/* const { sign } = require("jsonwebtoken"); */

module.exports = {
  login: (req, res) => {
    return res.render("login", { title: "Entra al perfil" });
  },
  processLogin: async (req, res) => {
    let errors = validationResult(req);

    if (errors.isEmpty()) {
      db.User.findOne({
        where: {
          email: req.body.email,
        },
      })
        .then((user) => {
          const { id, name, rolId, avatar } = user;
          req.session.userLogin = {
            id,
            name,
            rol: rolId,
            avatar,
          };
          if (req.body.remember) {
            res.cookie("amapola", req.session.userLogin, {
              maxAge: 1000 * 60 * 60 * 24,
            });
          }
          return res.redirect("/users/profile");
        })
        .catch((error) => console.log(error));

      /* cambiar le vista register por la de profile */
    } else {
      return res.render("login", {
        title: "Entra al perfil",
        errors: errors.mapped(),
      });
    }
  },
  register: (req, res) => {
    return res.render("register", { title: "Registro" });
  },
  processRegister: (req, res) => {
    let errors = validationResult(req);
    const { name, surname, email, password } = req.body;

    if (errors.isEmpty()) {
      db.User.create({
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        password: bcryptjs.hashSync(password, 12),
        rolId: 2,
        avatar: req.file?.filename || "avatar.png",
      })
        .then((user) => {
          db.Address.create({
            street: "",
            number: 0,
            location: "",
            province: "",
            postalcode: 0,
            active: true,
            userId: user.id,
          });
          return res.redirect("/users/login");
        })
        .catch((error) => console.log(error));
    } else {
      return res.render("register", {
        title: "Registrate",
        errors: errors.mapped(),
      });
    }
  },
  profile: (req, res) => {
    db.User.findByPk(req.session.userLogin.id)
      .then((user) => {
        return res.render("profile", {
          title: "Profile",
          user,
        });
      })
      .catch((error) => console.log(error));
  },
  logout: (req, res) => {
    req.session.destroy();
    res.cookie("amapola", null, { maxAge: -1 });
    return res.redirect("/");
  },
  update: (req, res) => {
    db.User.findByPk(req.session.userLogin.id, {
      include : ['addresses']
    })
      .then((user) => {
        return res.render("userEdit", {
          title: "Editar Perfil",
          user,
        });
      })
      .catch((error) => console.log(error));
  },
  processUpdate: async (req, res) => {
    try {
      let errors = validationResult(req);
      const { id } = req.session.userLogin;

      let user = await db.User.findByPk(req.params.id, {
        include: ["addresses"],
      });
      if (errors.isEmpty()) {
        const {
          name,
          surname,
          street,
          number,
          location,
          province,
          postalcode,
        } = req.body;

        await db.User.update(
          {
            name,
            surname,
          },
          {
            where: {
              id
            }
          }
        )

        await db.Address.update(
          {
            street,
            number : number || null,
            location,
            province,
            postalcode : postalcode || null,
          },
          {
            where : {
              userId : id
            }
          }
        )

   
          return res.redirect('/users/profile')
      } else {
        return res.send(errors.mapped())
        return res.render("profile", {
          user,
          title: 'Edición de Perfil'
        });
      }
    } catch (error) {
      console.log(error);
    }

  
  },
  logout: (req, res) => {
    req.session.destroy();
    res.cookie("amapola", null, { maxAge: -1 });
    return res.redirect("/");
  },
  usersDetail: async (req, res) => {
    try {
      let users = await db.User.findAll({
        order: ["name"],
      });
      if (users) {
        return res.status(200).json({
          ok: true,
          data: users,
        });
      }
      throw new Error({
        ok: false,
        msg: "error",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        ok: false,
        msg: error.message ? error.message : "comuniquese con el administrador",
      });
    }
  },
};

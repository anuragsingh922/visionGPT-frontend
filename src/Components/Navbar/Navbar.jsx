import React from "react";
import css from "./Navbar.module.css";

function Navbar() {
  return (
    <>
      <div className={css.navbar}>
        <div className={css.navfirst}>
          <ul className={css.ul}>
            <li className={`${css.li} ${css.heading}`}>Vision GPT</li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default Navbar;

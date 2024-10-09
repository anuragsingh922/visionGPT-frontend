"use-strict";
import React, { useEffect, useRef, useState } from "react";
import css from "./Landing.module.css";
import { ReactComponent as IMG_UPLOAD } from "../../Assets/SVG/image_upload.svg";
import Markdown from "react-markdown";
import toast from "react-hot-toast";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

function Vision_GPT() {
  const [url, seturl] = useState(null);
  const [base64image, setbase64image] = useState(null);
  const [generating, setgenerating] = useState(false);
  const [uploading, setuploading] = useState(false);
  const [chat_input, setchat_input] = useState("");
  const [chat, setchat] = useState([]);
  const [chathistory, setchathistory] = useState([]);
  const [chat_img, setchat_img] = useState("");
  const [ssid, setssid] = useState(null);

  const msgref = useRef(null);
  const msgref2 = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (chat) {
      msgref?.current?.scrollIntoView({ behavior: "smooth" });
      msgref2?.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat]);

  const scroll = () => {
    msgref?.current?.scrollIntoView({ behavior: "smooth" });
    msgref2?.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    textareaRef.current.focus();
  }, []);

  const fileupload = (e, type) => {
    try {
      const file = e.target.files[0];
      const maxSize = 10 * 1024 * 1024;
      if (file && file.size < maxSize) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (type === "file") {
            setuploading(true);
          }
        };

        reader.onloadend = async (e) => {
          if (type === "file") {
            setbase64image(reader.result);
            setuploading(false);
            seturl("");
            setchat_img(reader?.result);
            setchat([...chat, { img_src: reader?.result, speaker: "bot" }]);
            console.log("Chat : ", chat);
          } else {
            setchat_img(reader?.result);
            setchat([...chat, { img_src: reader?.result, speaker: "bot" }]);
            console.log("Chat : ", chat);
          }
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("File size if larger then max size.");
      }
    } catch (err) {
      toast.error("Error in file upload.");
      console.log("Error in file upload. ", err);
    }
  };

  const screenshot = async (query) => {
    try {
      if (ssid) {
        const d = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/delete_img`,
          {
            id: ssid,
          },
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );

        console.log("Response file deleting : ", d.status);
      }
      console.log("Url in screenshot in frontend : ", query);
      const sessionId = uuidv4();
      setssid(sessionId);
      const location = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/screenshot`,
        {
          query: query,
          id: sessionId,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );

      console.log("Screenshot Status : ", location.status);
      return { status: location.status, path: location.data.path };
    } catch (err) {
      setgenerating(false);
      console.log("Error in backend in taking screenshot : ", err);
      console.log("Screenshot Status : ", 500);
      return { status: 500 };
    }
  };

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const handlechat = async (e) => {
    try {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // setchat([...chat , { message: chat_input, speaker: "user" }]);
        // setchat([...chat , { message: "Typing...", speaker: "bot" }]);
        let msgs = chat;
        msgs.push({ message: chat_input, speaker: "user" });
        msgs.push({ message: "Typing...", speaker: "bot" });
        setchat_input("");
        setchathistory([
          ...chathistory,
          { message: chat_input, speaker: "user" },
        ]);
        scroll();
        setTimeout(() => {
          scroll();
        }, 100);
        setTimeout(() => {
          scroll();
        }, 500);

        let { data } = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/getChatResponse`,
          {
            user_question: chat_input,
            base64image: base64image?base64image:null,
            chat: chathistory,
            type: "tool",
          }
        );

        if (base64image) {
        //   setchathistory((prv)=>[
        //     ...prv,
        //     { message: base64image, speaker: "bot" },
        //   ]);
          setbase64image("");
        }

        let response = data?.msg;
        const success = data?.success;
        const query = data.query;

        if (!response || !success) {
          msgs.pop();
          toast.error("Somethign unusual occured.");
          return;
        }

        if (response === "web_search" && query) {
          console.log("Calling screenshot.");
          const p = await screenshot(query);
          if (p.status === 500) {
            seturl(
              "Sorry but we are facing issue at that point of time.Please try again."
            );
            setgenerating(false);
            msgs.pop();
            toast.error("Error ocured during web scraping.");
            return;
          }

          const back_image_url = `${process.env.REACT_APP_BACKEND_URL}/screenshot/${p.path}.jpg`;

          console.log("Image URL : ", back_image_url);

          const b_img = await fetch(back_image_url);
          const bl = await b_img.blob();

          const b_string = await blobToBase64(bl);

          msgs.pop();

          msgs.push({ img_src: back_image_url, speaker: "bot" });
          msgs.push({ message: "Typing...", speaker: "bot" });

          setchat(() => {
            return [...msgs];
          });

          let { data } = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/getChatResponse`,
            {
              user_question: "null",
              base64image: b_string,
              chat: chathistory,
              type: "normal",
            }
          );

          response = data?.msg;
        //   setchathistory((prv)=>[
        //     ...prv,
        //     { message: b_string, speaker: "user" },
        //   ]);
        }
        // msgs.push({ message: openai_chat_res, speaker: "bot" });
        // setchat(msgs);
        console.log("Chat Res : ", response);

        if (!response) {
          msgs.pop();
          toast.error("Something unusual occured.");
          return;
        }
        setchathistory((prv)=>[...prv, { message: response, speaker: "bot" }]);
        msgs.pop();
        msgs.push({ message: response, speaker: "bot" });
        setchat(() => {
          return [...msgs];
        });
      }
    } catch (err) {
      console.log("Error in openai search : ", err);
      toast.error("Error in openai search.");
    }
  };

  return (
    <div className={css.main}>
      <div className={css.middle}>
        <div className={css.transcript_box}>
          <div className={css.chat_top}>
            {chat && chat.length > 0 && (
              <div className={`${css.chat_p}`}>
                {chat.map((item, index) => (
                  <div
                    key={index}
                    className={`${css.chat_div} ${
                      item.speaker === "user" && css.user
                    }`}
                  >
                    {item.img_src ? (
                      <div className={`${css.chat_img}`}>
                        <img src={item.img_src} alt="" srcset="" />
                      </div>
                    ) : (
                      <div key={index + 1} className={`${css.chat_item}`}>
                        <Markdown ref={msgref}>{item.message}</Markdown>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div ref={msgref2}></div>
          </div>
          <footer className={css.footer}>
            <textarea
              className={css.chat_input}
              onChange={(e) => {
                setchat_input(e.target.value);
              }}
              value={chat_input}
              ref={textareaRef}
              placeholder="Ask your query...."
              onKeyDown={async (e) => {
                await handlechat(e);
              }}
            ></textarea>
            <div className={`${css.mic}`}>
              {/* <MIC_SVG
                  className={`${css.mic_svg_1} ${ismic && css.mic_svg}`}
                /> */}
              <input
                type="file"
                className={`${css.chat_image_input}`}
                onChange={(e) => {
                  fileupload(e, "file");
                }}
              />
              <IMG_UPLOAD className={`${css.image_upload}`} />
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Vision_GPT;

import { useEffect, useState, useRef } from "react";
import { getDataQyfb } from "../service/index.js";
import * as echarts from "echarts";
import "./sbpk-echart.less";
import SbpkLeftOne from "./sbpk-left-one/sbpk-left-one";
import SbpkRightOne from "./sbpk-right-one/sbpk-right-one";
function SbpkEchart() {
  const chartRef = useRef(null);
  const chartQyfbRef = useRef(null);
  const chartYszbRef = useRef(null);
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000); // 每秒更新一次时间

    return () => clearInterval(timer); // 清理定时器
  }, []);

  const padZero = (number) => (number < 10 ? `0${number}` : number);
  const timeFormat = (time) => {
    const year = time.getFullYear();
    const month = time.getMonth() + 1;
    const date = time.getDate();
    const hours = padZero(time.getHours());
    const minutes = padZero(time.getMinutes());
    const seconds = padZero(time.getSeconds());

    return `${year}年${month}月${date}日 ${hours}:${minutes}:${seconds}`;
  };

  /**
   * 区域分布
   */
  useEffect(() => {
    let initialized = false;
    const initChart = async () => {
      const res = await getDataQyfb();
      if (!initialized) {
        // 仅在未初始化时进行初始化，注意不可以将异步请求加入到这个里面，否则不会生效。
        let chartInstance = echarts.init(chartQyfbRef.current);
        chartInstance.setOption(getChartOptions("区域分布", res));
      }
    };

    initChart();

    return () => {
      initialized = true;
    };
  }, []);

  /**
   * 运输占比
   */
  useEffect(() => {
    let initialized = false;
    let timer = null;
    const list = ["铁路", "公路", "水路", "航空"];
    let index = 0;
    const initChart = async () => {
      const res = await getDataQyfb();
      if (!initialized) {
        // 仅在未初始化时进行初始化，注意不可以将异步请求加入到这个里面，否则不会生效。
        let chartInstance = echarts.init(chartYszbRef.current);
        chartInstance.setOption(getChartOptions("运输占比", res));
        //     chartInstance.dispatchAction({
        //       type: 'select',
        //       name: '铁路',
        //   })
        //   chartInstance.dispatchAction({
        //     type: 'highlight',
        //     name: '铁路',
        // })
        timer = setInterval(() => {
          index = index % 4;
          console.log("index", index);
          // chartInstance.dispatchAction({
          //   type: "select",
          //   name: list[index],
          // });
          chartInstance.dispatchAction({
            type: "highlight",
            name: list[index],
          });
          list.forEach((item,i)=>{
            if(i==index){
              chartInstance.dispatchAction({
                type: "highlight",
                name: list[i],
              });
            }else{
              chartInstance.dispatchAction({
                type: "downplay",
                name: list[i],
              });
            }
          })
          index++;
        }, 2000);
      }
    };

    initChart();

    return () => {
      initialized = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="sbpk-echarts">
      <div className="sbpk-echarts-header">
        <h2 className="title">大屏数据展示</h2>
        <button
          onClick={() => {
            chartYszbRef.current.dispatchAction({
              type: "select",
              name: "铁路",
            });
          }}
        >
          测试触发事件
        </button>
        <p className="time">{timeFormat(time)}</p>
      </div>
      <div className="sbpk-echarts-body">
        <div className="sbpk-echarts-left">
          <div className="sbpk-echarts-row display-flex-column">
            <div className="echart-header">
              <img
                className="icon"
                src={"/img/echarts/功能定义.png"}
                width={25}
              />
              <p>运输吞吐量</p>
            </div>
            <div className="echart-container ttl">
              <div className="ttl-left">
                <div className="ttl-item">
                  <div className="margin-bottom-10">
                    <span className="ttl-num">2341</span>
                    <span className="ttl-unit">万吨</span>
                  </div>
                  <div className="font-size-14 ttl-bottom">
                    <img
                      className="ttl-icon margin-right-5"
                      src={"/img/echarts/铁路.png"}
                      width={18}
                    />
                    铁路
                  </div>
                </div>
                <div className="ttl-line"></div>
                <div className="ttl-item">
                  <div className="margin-bottom-10">
                    <span className="ttl-num">1341</span>
                    <span className="ttl-unit">万吨</span>
                  </div>
                  <div className="font-size-14 ttl-bottom">
                    <img
                      className="ttl-icon margin-right-5"
                      src={"/img/echarts/公路.png"}
                      width={18}
                    />
                    公路
                  </div>
                </div>
              </div>
              <div className="ttl-right">
                <div className="ttl-item">
                  <div className="margin-bottom-10">
                    <span className="ttl-num">4341</span>
                    <span className="ttl-unit">万吨</span>
                  </div>
                  <div className="font-size-14 ttl-bottom">
                    <img
                      className="ttl-icon margin-right-5"
                      src={"/img/echarts/综合-水路运输.png"}
                      width={24}
                    />
                    水路
                  </div>
                </div>
                <div className="ttl-line"></div>
                <div className="ttl-item">
                  <div className="margin-bottom-10">
                    <span className="ttl-num">435</span>
                    <span className="ttl-unit">万吨</span>
                  </div>
                  <div className="font-size-14 ttl-bottom">
                    <img
                      className="ttl-icon margin-right-5"
                      src={"/img/echarts/民航运输运输.png"}
                      width={18}
                    />
                    航空
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="sbpk-echarts-row">
            <div className="sbpk-echarts-col">
              <div className="echart-header">
                <img
                  className="icon"
                  src={"/img/echarts/规则引擎.png"}
                  width={25}
                />
                <p>区域分布</p>
              </div>
              <div className="echart-container qyfb">
                <div
                  ref={chartQyfbRef}
                  style={{ height: "200px", width: "100%" }}
                ></div>
              </div>
            </div>
            <div className="sbpk-echarts-col">
              <div className="echart-header">
                <img
                  className="icon"
                  src={"/img/echarts/节点管理.png"}
                  width={25}
                />
                <p>运输占比</p>
              </div>
              <div className="echart-container yszb">
                <div
                  ref={chartYszbRef}
                  style={{ height: "200px", width: "100%" }}
                ></div>
              </div>
            </div>
          </div>
          <div className="sbpk-echarts-row">
            <div className="sbpk-echarts-col">
              <div className="echart-header">
                <img
                  className="icon"
                  src={"/img/echarts/设备管理.png"}
                  width={25}
                />
                <p>数据标题4</p>
              </div>
            </div>
            <div className="sbpk-echarts-col">
              <div className="echart-header">
                <img
                  className="icon"
                  src={"/img/echarts/神经.png"}
                  width={25}
                />
                <p>数据标题5</p>
              </div>
            </div>
          </div>
          <div className="sbpk-echarts-row">
            <div className="echart-header">
              <img
                className="icon"
                src={"/img/echarts/图表-折线图.png"}
                width={25}
              />
              <p>数据标题6</p>
            </div>
            <div className="echart-container"></div>
          </div>
        </div>
        <div className="sbpk-echarts-right">{/* <SbpkRightOne /> */}</div>
      </div>
    </div>
  );
}
export default SbpkEchart;

function getChartOptions(type, data) {
  let options = {};
  switch (type) {
    case "区域分布":
      options = {
        legend: {
          show: false,
        },
        grid: {
          top: "10%",
          left: "12%",
          // bottom:'10%',
          right: 0,
        },
        color: ["#8FB2C9", "#44A9EB", "#2D5BFB", "#44EBEA"],
        tooltip: {},
        dataset: {
          source: [
            ["product", "铁路", "公路", "水路", "航空"],
            ["华北地区", 43.3, 85.8, 93.7, 12],
            ["华东地区", 83.1, 73.4, 55.1, 13],
            ["华南地区", 86.4, 65.2, 82.5, 14],
          ],
        },
        xAxis: {
          type: "category",
          axisLabel: {
            textStyle: {
              color: "#8CA3B6", //坐标的字体颜色
            },
          },
        },
        yAxis: {
          axisLabel: {
            textStyle: {
              color: "#8CA3B6", //坐标的字体颜色
            },
          },
          splitLine: {
            //分割线配置
            lineStyle: {
              color: "#8CA3B6",
            },
          },
        },
        // Declare several bar series, each will be mapped
        // to a column of dataset.source by default.
        series: [
          { type: "bar" },
          { type: "bar" },
          { type: "bar" },
          { type: "bar" },
        ],
      };
      break;
    case "运输占比":
      options = {
        tooltip: {
          trigger: "item",
        },
        legend: {
          show: true,
          orient: "vertical",
          top: "15%",
          right: 0,
          textStyle: {
            color: "#8CA3B6",
          },
          icon: "pin",
        },
        color: ["#8FB2C9", "#44A9EB", "#2D5BFB", "#44EBEA"],
        series: [
          {
            // name: 'Access From',
            type: "pie",
            radius: ["58%", "65%"],
            center: ["40%", "40%"],
            avoidLabelOverlap: false,
            // selectedMode:'single',
            // selectedOffset:'5',
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 18,
                color: "#fff",
                formatter: (v) => {
                  const { data, percent } = v;
                  const { name, value } = data;
                  const list = [
                    `{a|${percent.toFixed(2)}}{x|%}`,
                    `{b|${name}}`,
                  ];
                  const str = list.join("\n");
                  return str;
                },
                rich: {
                  a: {
                    fontSize: 18,
                  },
                  b: {
                    fontSize: 10,
                    lineHeight: 15,
                  },
                  x: {
                    fontSize: 10,
                  },
                },
              },
            },
            labelLine: {
              show: false,
            },
            data: [
              { value: 1048, name: "铁路" },
              { value: 735, name: "公路" },
              { value: 580, name: "水路" },
              { value: 484, name: "航空" },
            ],
          },
        ],
      };
      break;
    default:
      break;
  }
  return options;
}

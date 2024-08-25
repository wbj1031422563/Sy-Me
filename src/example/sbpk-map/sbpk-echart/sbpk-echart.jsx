import { useEffect, useState, useRef } from "react";
import { getDataQyfb, getDataFgfb } from "../service/index.js";
import * as echarts from "echarts";
import "./sbpk-echart.less";
import SbpkLeftOne from "./sbpk-left-one/sbpk-left-one";
import SbpkRightOne from "./sbpk-right-one/sbpk-right-one";
function SbpkEchart() {
  const chartRef = useRef(null);
  const chartQyfbRef = useRef(null);
  const chartYszbRef = useRef(null);
  const chartFgfbRef = useRef(null);
  const chartYstjRef = useRef(null);
  const chartBhqsRef = useRef(null);
  const [selectedArea, setelectedArea] = useState("全国地区");
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
          // console.log("index", index);
          // chartInstance.dispatchAction({
          //   type: "select",
          //   name: list[index],
          // });
          chartInstance.dispatchAction({
            type: "highlight",
            name: list[index],
          });
          list.forEach((item, i) => {
            if (i == index) {
              chartInstance.dispatchAction({
                type: "highlight",
                name: list[i],
              });
            } else {
              chartInstance.dispatchAction({
                type: "downplay",
                name: list[i],
              });
            }
          });
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
  /**
   * 峰谷分布
   */
  useEffect(() => {
    let initialized = false;
    const initChart = async () => {
      const res = await getDataFgfb();
      if (!initialized) {
        // 仅在未初始化时进行初始化，注意不可以将异步请求加入到这个里面，否则不会生效。
        let chartInstance = echarts.init(chartFgfbRef.current);
        chartInstance.setOption(getChartOptions("峰谷分布", res));
      }
    };

    initChart();

    return () => {
      initialized = true;
    };
  }, []);
  /**
   * 近五年来运输统计
   */
  useEffect(() => {
    let initialized = false;
    const initChart = async () => {
      const res = await getDataFgfb();
      if (!initialized) {
        // 仅在未初始化时进行初始化，注意不可以将异步请求加入到这个里面，否则不会生效。
        let chartInstance = echarts.init(chartYstjRef.current);
        chartInstance.setOption(getChartOptions("近五年运输统计", res));
      }
    };

    initChart();

    return () => {
      initialized = true;
    };
  }, []);
  /**
   * 运输变化趋势
   */
  useEffect(() => {
    let initialized = false;
    const initChart = async () => {
      const res = await getDataFgfb();
      if (!initialized) {
        // 仅在未初始化时进行初始化，注意不可以将异步请求加入到这个里面，否则不会生效。
        let chartInstance = echarts.init(chartBhqsRef.current);
        chartInstance.setOption(getChartOptions("运输变化趋势", res));
      }
    };

    initChart();

    return () => {
      initialized = true;
    };
  }, []);

  return (
    <div className="sbpk-echarts">
      <div className="sbpk-echarts-header">
        <h2 className="title">全国交通运输数据驾驶舱</h2>
        <p className="time">{timeFormat(time)}</p>
      </div>
      <div className="sbpk-echarts-body">
        <div className="sbpk-echarts-right">
          <div className="area-list">
            <div
              className={
                selectedArea == "全国地区"
                  ? "area-list-item active"
                  : "area-list-item"
              }
              onClick={()=>{setelectedArea('全国地区')}}
            >
              <img
                className="icon"
                src={"/img/echarts/标记备份 (1).png"}
                style={{ opacity: selectedArea == "全国地区" ? 1 : 0 }}
                width={25}
              />
              <span>全国地区</span>
            </div>

            <div
              className={
                selectedArea == "华北地区"
                  ? "area-list-item active"
                  : "area-list-item"
              }
              onClick={()=>{setelectedArea('华北地区')}}
            >
              <img
                className="icon"
                src={"/img/echarts/标记备份 (1).png"}
                style={{ opacity: selectedArea == "华北地区" ? 1 : 0 }}
                width={25}
              />
              <span>华北地区</span>
            </div>

            <div
              className={
                selectedArea == "华东地区"
                  ? "area-list-item active"
                  : "area-list-item"
              }
              onClick={()=>{setelectedArea('华东地区')}}
            >
              <img
                className="icon"
                src={"/img/echarts/标记备份 (1).png"}
                style={{ opacity: selectedArea == "华东地区" ? 1 : 0 }}
                width={25}
              />
              <span>华东地区</span>
            </div>
            <div
              className={
                selectedArea == "华南地区"
                  ? "area-list-item active"
                  : "area-list-item"
              }
              onClick={()=>{setelectedArea('华南地区')}}
            >
              <img
                className="icon"
                src={"/img/echarts/标记备份 (1).png"}
                style={{ opacity: selectedArea == "华南地区" ? 1 : 0 }}
                width={25}
              />
              <span>华南地区</span>
            </div>
          </div>
        </div>
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
                    <span className="ttl-unit">亿吨</span>
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
                    <span className="ttl-unit">亿吨</span>
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
                    <span className="ttl-unit">亿吨</span>
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
                    <span className="ttl-unit">亿吨</span>
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
                <p>近五年运输统计</p>
              </div>
              <div className="echart-container ystj">
                <div
                  ref={chartYstjRef}
                  style={{ height: "200px", width: "100%" }}
                ></div>
              </div>
            </div>
            <div className="sbpk-echarts-col">
              <div className="echart-header">
                <img
                  className="icon"
                  src={"/img/echarts/神经.png"}
                  width={25}
                />
                <p>运输增长趋势</p>
              </div>
              <div className="echart-container ysbhqs">
                <div
                  ref={chartBhqsRef}
                  style={{ height: "200px", width: "100%" }}
                ></div>
              </div>
            </div>
          </div>
          <div className="sbpk-echarts-row sbpk-echarts-row2">
            <div className="echart-header">
              <img
                className="icon"
                src={"/img/echarts/图表-折线图.png"}
                width={25}
              />
              <p>运输峰谷分布</p>
            </div>
            <div className="echart-container fgfb">
              <div
                ref={chartFgfbRef}
                style={{ height: "200px", width: "100%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SbpkEchart;

function getChartOptions(type, data) {
  let options = {};
  const ystj = {
    data: [70, 34, 60, 78, 69],
    titlename: ["2020", "2021", "2022", "2023", "2024"],
    valdata: [683, 234, 234, 523, 345],
    myColor: ["#1089E7", "#F57474", "#56D0E3", "#F8B448", "#8B78F6"],
  };
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
    case "峰谷分布":
      options = {
        grid: {
          top: "8%",
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          axisLabel: {
            textStyle: {
              color: "#8CA3B6", //坐标的字体颜色
            },
          },
          data: [
            "1月",
            "2月",
            "3月",
            "4月",
            "5月",
            "6月",
            "7月",
            "8月",
            "9月",
            "10月",
            "11月",
            "12月",
          ],
        },
        yAxis: {
          type: "value",
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

        series: [
          {
            data: [
              820, 932, 901, 934, 1290, 1330, 742, 689, 895, 926, 1270, 1380,
            ],
            type: "line",
            symbol: "rect",
            itemStyle: {
              normal: {
                borderWidth: 0,
                color: "#7498f9", //改变折线点的颜色
                lineStyle: {
                  color: "#44A9EB", //改变折线颜色
                },
              },
            },
            // itemStyle:{
            //   normal:{
            //       color:'red',//拐点颜色
            //       borderColor:'#000000',//拐点边框颜色
            //       borderWidth:3//拐点边框大小
            //   },
            //   emphasis: {
            //         color: '#000000'//hover拐点颜色定义
            //     }
            // },
            label: {
              show: true,
              color: "#8CA3B6",
            },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "#44A9EB", // 0% 处的颜色
                  },
                  {
                    offset: 0.5,
                    color: "rgba(68,169,235,0.0)", // 100% 处的颜色
                  },
                ],
                global: false, // 缺省为 false
              },
            },
          },
        ],
      };
      break;
    case "近五年运输统计":
      options = {
        // backgroundColor: "#0e2147",
        grid: {
          top: "5%",
          left: "15%",
          bottom: "20%",
          right: "5%",
        },
        xAxis: {
          show: false,
        },
        yAxis: [
          {
            show: true,
            data: ystj.titlename,
            inverse: true,
            axisLine: {
              show: false,
            },
            splitLine: {
              show: false,
            },
            axisTick: {
              show: false,
            },
            axisLabel: {
              color: "#8CA3B6",
            },
            // axisLabel: {
            //   textStyle: {
            //     color: "#8CA3B6", //坐标的字体颜色
            //   },
            // },
          },
          {
            show: true,
            inverse: true,
            data: ystj.valdata,
            axisLabel: {
              show: false,
            },
            axisLine: {
              show: false,
            },
            splitLine: {
              show: false,
            },
            axisTick: {
              show: false,
            },
          },
        ],
        series: [
          {
            name: "条",
            type: "bar",
            yAxisIndex: 0,
            data: ystj.data,
            color: ["#44A9EB"],
            // barWidth: 30,
            itemStyle: {
              normal: {
                barBorderRadius: 30,
                // color: function (params) {
                //   var num = ystj.myColor.length;
                //   return ystj.myColor[params.dataIndex % num];
                // },
              },
            },
            label: {
              // color:'#8CA3B6',
              normal: {
                show: true,
                color: "#7498f9",
                position: "right",
                formatter: "{c}%",
              },
            },
          },
          {
            name: "框",
            type: "bar",
            yAxisIndex: 1,
            barGap: "-100%",
            data: [100, 100, 100, 100, 100],
            // barWidth: 40,
            label: { show: false },
            itemStyle: {
              normal: {
                color: "none",
                borderColor: "#8CA3B6",
                borderWidth: 1,
                barBorderRadius: 15,
              },
            },
          },
        ],
      };
      break;
    case "运输变化趋势":
      options = {
        // title: {
        //   text: 'Stacked Area Chart'
        // },
        // tooltip: {
        //   trigger: 'axis',
        //   axisPointer: {
        //     type: 'cross',
        //     label: {
        //       backgroundColor: '#6a7985'
        //     }
        //   }
        // },
        legend: {
          show: true,
          orient: "horizontal",
          data: ["同比增长", "环比增长"],
          itemWidth: 10,
          textStyle: {
            color: "#8CA3B6",
          },
          bottom: "10%",
          right: "20%",
        },
        color: ["#7498f9", "#44A9EB"],
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "#44A9EB", // 0% 处的颜色
              },
              {
                offset: 0.5,
                color: "rgba(68,169,235,0.0)", // 100% 处的颜色
              },
            ],
            global: false, // 缺省为 false
          },
        },
        grid: {
          top: "10%",
          left: "10%",
          // containLabel: true
        },
        xAxis: [
          {
            type: "category",
            boundaryGap: false,
            data: ["1季度", "2季度", "3季度"],
            axisLabel: {
              textStyle: {
                color: "#8CA3B6", //坐标的字体颜色
              },
            },
          },
        ],
        yAxis: [
          {
            type: "value",
            max: 20,
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
        ],
        series: [
          {
            name: "同比增长",
            type: "line",
            stack: "Total",
            areaStyle: {},
            emphasis: {
              focus: "series",
            },
            symbol: "rect",
            data: [1, 9, 8],
          },
          {
            name: "环比增长",
            type: "line",
            stack: "Total",
            symbol: "rect",
            areaStyle: {},
            emphasis: {
              focus: "series",
            },
            data: [2, 4, 8],
          },
        ],
      };
      break;
    default:
      break;
  }
  return options;
}

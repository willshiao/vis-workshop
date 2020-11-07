const dom = document.getElementById('graph')
const chart = echarts.init(dom)
let allData = null
const option = {
  title: {
    text: 'Course Enrollment Chart'
  },
  tooltip: {
    trigger: 'axis',
    formatter (params) {
      let val = ''
      const chartDate = echarts.format.formatTime('h on dd-MM-yyyy', params[0].value[0])
      for (let i = 0; i < params.length; ++i) {
        val += '<li style="list-style:none">' + params[i].marker +
            params[i].seriesName + ':&nbsp;' + params[i].value[1] + '</li>'
      }
      return chartDate + val
    }
  },
  legend: {
    data: []
  },
  xAxis: {
    type: 'time',
    splitLine: {
      show: false
    }
  },
  yAxis: {
    type: 'value',
    splitLine: {
      show: false
    }
  },
  dataZoom: [{ type: 'inside' }, { type: 'slider' }],
  series: []
}
const app = {}

function interpolateData (data) {
  console.log(data)
  const output = []
  const currentDate = new Date(data[0][0])
  currentDate.setHours(currentDate.getHours() + 1)
  currentDate.setMinutes(0, 0, 0)

  const lastDate = new Date(data[data.length - 1][0])
  lastDate.setHours(lastDate.getHours() + 1)
  lastDate.setMinutes(0, 0, 0)
  console.log(currentDate, lastDate)

  let dataIdx = 0
  let lastCnt = data[0][1]
  while (currentDate < lastDate) {
    while (dataIdx < data.length && new Date(data[dataIdx][0]) < currentDate) {
      lastCnt = data[dataIdx][1]
      dataIdx++
    }
    output.push([currentDate.toISOString(), lastCnt])
    currentDate.setHours(currentDate.getHours() + 1)
  }
  return output
}

function partitionDataByCrn (data) {
  const output = {}
  data.forEach(item => {
    if (!(item.courseReferenceNumber in output)) {
      output[item.courseReferenceNumber] = [item]
    } else {
      output[item.courseReferenceNumber].push(item)
    }
  })
  return output
}

function addData (courseData, term = 'Spring 2018') {
  const filteredData = courseData
    .filter(x => x.termDesc === term && x.scheduleTypeDescription === 'Lecture')
  const partitioned = partitionDataByCrn(filteredData)
  for (const crn in partitioned) {
    const crnData = partitioned[crn]
    const data = crnData.map(item => {
      return [
        item.pollTime.$date,
        item.enrollment
      ]
    })
    const name = `${crnData[0].subjectCourse} (${crnData[0].courseReferenceNumber})`
    option.legend.data.push(name)
    option.series.push({
      name,
      type: 'line',
      showSymbol: false,
      hoverAnimation: true,
      data: interpolateData(data),
      step: 'middle'
    })
  }
}

$('#panel-form').submit(e => {
  e.preventDefault()
  const shouldFill = $('#fill-area').is(':checked')
  console.log(shouldFill)
  if (shouldFill) {
    option.series.forEach(el => { el.areaStyle = {} })
  } else {
    option.series.forEach(el => { el.areaStyle = null })
  }
  chart.setOption(option, true)
})

async function main() {
  // Make requests in parallel
  const reqs = ['data/courses/cs010.json', 'data/courses/cs012.json', 'data/courses/cs014.json']
    .map(async x => (await fetch(x)).json())
  allData = await Promise.all(reqs)
  allData.forEach(x => addData(x))
  chart.setOption(option, true)
}

main()

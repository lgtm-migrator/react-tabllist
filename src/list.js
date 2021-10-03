import _ from 'lodash'import React from 'react'import config from './config'import './index.scss'import * as util from './util'import { getExposeList } from './util'export default class _ReactTabllist extends React.Component {  constructor(props) {    super(props)    this.state = {      // 每列单元格的宽度数组      colWidth: [],      // body可见区域的高度      visibleScrollHeight: 0,      // 所有复选框和单选按钮的状态      selected: { rowCheckbox: [] },      // 行选择框的indeterminate状态      indeterminate: false,      // 当停用列表滚动且表头开启时，会自动计算这个值，以使表头的总宽度和列表主体相同      // 主要目的是为了消除因滚动条占用部分位置使表头和列表主体形成的宽度差      headerWidth: 0,      // 列表行缓动动画的样式名      transitionName: '',      // 行样式      rowStyle: [],      // 配置属性      property: config.property,      // 渲染数据      data: config.data,      // 列表的自定义样式表名      className: config.className    }    // 当一次滚动多行时可用，组件当前可视区域内第一行的索引    this.firstRowIndexInViewableArea = 0    // 列表滚动状态（true:暂停滚动或未滚动 false:正在滚动）    this.paused = true    // 滚动次数（即列表底部出现在可视区域内的次数。合法值：正整数；其余皆为不合法值，默认为代表无限制滚动）    this.scrollFrequency = 0    // React事件集合    this.events = {      mainContainer: {},      scrollContainer: {}    }    // 处理后最终用于渲染列表的data    // 如果props里传递的数据（data）不规范，则自动补齐单元格到缺少的行，直到每一行的单元格数量相等为止    this.renderData = []    // visibilitychange事件绑定的函数    this.visibilitychangeFn = () => {      this.pause(document.hidden)    }  }  static getDerivedStateFromProps(props, state) {    let { property, data: stateData, className, ...restState } = state    const { property: propsProperty, data: propsData, className: propsClassName } = props    // 检测本次渲染的数据是否有变化    const isDataChanged = !_.isEqual(propsData, stateData)    // 检测本次渲染的属性是否有变化    if (!_.isEqual(propsProperty, property) || !_.isEqual(propsClassName, className) || isDataChanged) {      const { height: propsHeight } = props.property.style      const { height: stateHeight } = property.style      const { width: propsCellWidth } = props.property.body.cell.style      const { width: stateCellWidth } = property.body.cell.style      const { row } = props.property.body      const transitionName = property.body.row.transition        ? util.getTransitionName(row.transition, isDataChanged)        : state.transitionName      return {        ...restState,        property: propsProperty,        data: propsData,        className: propsClassName,        transitionName,        rowStyle: util.getRowStyle(props),        colWidth: propsCellWidth !== stateCellWidth ? util.handleColWidth(props, propsData) : state.colWidth,        visibleScrollHeight: propsHeight !== stateHeight ?          util.getVisibleHeightOfScroll(props) :          state.visibleScrollHeight      }    }    // 如果props未更新属性，则返回state。此state已包含setState更新的值。    return state  }  /**   * 组件挂载后执行组件的滚动操作和设置表头单元格和主体单元格宽度对应   */  componentDidMount() {    const { props, listContMain, mainContainer } = this    const colWidth = util.getColClientWidth(listContMain)    // 如果列数为0，则停止后续操作    if (colWidth.length) {      // 组件第一次render之后，DOM结构已经生成，此时开始设置每个单元格宽度以及组件滚动区域高度      // width设置规则以props里面的width字段为准，详情见width字段说明      const visibleScrollHeight = util.getVisibleHeightOfScroll(props, mainContainer)      this.setState({ colWidth, visibleScrollHeight }, () => {        // 列表滚动相关逻辑入口        this.pause(!this.configureRollingContainer())        // 检测浏览器当前标签页是否被激活，否则暂停滚动动画（如果启用了组件滚动）        document.addEventListener('visibilitychange', this.visibilitychangeFn)      })    }    // 初始化事件    this.events = {      ...this.events,      ...util.expPropsAndMethodsForEvent.call(this)    }    // 监听自定义滚动相关事件    this.scrollContainer.addEventListener('custom_onScrollTo', this.handleScrollTo)    this.scrollContainer.addEventListener('custom_onScrollToEnd', this.handleScrollToEnd)    this.scrollContainer.addEventListener('custom_onScrollFullCircle', this.handleScrollFullCircle)  }  /**   * 组件每次更新后执行   * @param {Readonly<P>} preProps previous props   * @param {Readonly<S>} preState previous state   */  componentDidUpdate(preProps, preState) {    const { listContMain, props, mainContainer } = this    const colWidth = util.getColClientWidth(listContMain)    if (colWidth.length) {      const { width: colCellWidth, minWidth: cellMinWidth } = props.property.body.cell.style      const { width: preColCellWidth, minWidth: preCellMinWidth } = preProps.property.body.cell.style      const {        property: {          style: { width: conWidth, height },          scroll: { enable },          header: { show }, body        },        transitionName,        indeterminate      } = this.state      const {        body: preBody,        header: { show: preShow },        style: { width: preConWidth, height: preHeight }      } = preState.property      const { cell, row } = body      const { width: iconWidth } = cell.iconStyle      const { width: preIconWidth } = preBody.cell.iconStyle      const { transition, rowCheckbox: { show: rowCheckboxShow } } = row      // 当滚动条显示时，重新计算header的宽度，和列表主体对齐      if (show && !enable && !_.isEqual(this.state, preState)) {        this.setState({ headerWidth: this.listContMain.clientWidth })      }      // 适应单元格宽度，用于组件自身状态或从父级传递的props发生变化时      if (        preConWidth !== conWidth ||        iconWidth !== preIconWidth ||        colCellWidth !== preColCellWidth ||        cellMinWidth !== preCellMinWidth      ) {        // 避免css动画未执行完时获取的列宽不正确，400为css动画的持续时间，见index.scss文件        setTimeout(() => {          /**           * 组件更新之后，DOM结构已更新，此时重新设置每个单元格宽度           * 设置规则以props里面的width字段为准           * 详情见width字段说明           */          this.setState({ colWidth })        }, colCellWidth === 'avg' ? 400 : 0)      }      // 适应滚动区域高度      if (parseInt(preHeight) !== parseInt(height) || preShow !== show) {        this.setState(prevState => ({          visibleScrollHeight: util.getVisibleHeightOfScroll(prevState, mainContainer)        }))      }      // 缓动动画      if (transition) {        if (!transitionName) {          this.setState({ transitionName: util.getTransitionName(transition, true) })        } else if (transitionName === 'list-row-start') {          this.setState({ transitionName: util.getTransitionName(transition, false) })        }      }      // 设置列表头行选择框的indeterminate      // 如果开启了行选择功能且显示表头，根据每行的选择情况设置标题栏多选框的indeterminate状态      if (show && rowCheckboxShow) {        this.scrollContainer          .parentNode          .querySelector('.list-header input[name=rowCheckbox]')          .indeterminate = indeterminate      }      // 状态变化后，重新计算滚动容器的属性      this.configureRollingContainer()    }  }  componentWillUnmount() {    // 清除滚动相关的定时器    clearInterval(this.marqueeInterval)    clearInterval(this.marqueeIntervalRow)    // 移除浏览器窗口visibilitychange事件    document.removeEventListener('visibilitychange', this.visibilitychangeFn)    // 移除自定义滚动相关事件    this.scrollContainer.removeEventListener('custom_onScrollTo', this.handleScrollTo)    this.scrollContainer.removeEventListener('custom_onScrollToEnd', this.handleScrollToEnd)    this.scrollContainer.removeEventListener('custom_onScrollFullCircle', this.handleScrollFullCircle)  }  /**   * 自定义onScrollTo事件回调函数   * 一次性滚动（scroll.distance<0时）结束后或调用公开的scrollTo函数后触发   * @param {SyntheticEvent} e event   */  handleScrollTo = e => {    this.props['custom_onScrollTo']?.(e, getExposeList.call(this))  }  /**   * 自定义onScrollToEnd事件回调函数   * 滚动到组件尾部触发，即滚动到最后一行时触发   * @param {SyntheticEvent} e event   */  handleScrollToEnd = e => {    this.props['custom_onScrollToEnd']?.(e, getExposeList.call(this))  }  /**   * 自定义onScrollFullCircle事件回调函数   * 滚动完整一圈后触发   * @param {SyntheticEvent} e event   */  handleScrollFullCircle = e => {    this.props['custom_onScrollFullCircle']?.(e, getExposeList.call(this))  }  /**   * 列表滚动前置条件处理   * 根据配置项和计算得出的列表滚动区域高度，检测列表是否达到滚动的条件，来决定是否显示列表的滚动辅助元素   * @returns {boolean} 根据列表自动计算得出是否需要滚动的结果   */  configureRollingContainer = () => {    const {      listContMain,      listContSupport,      state: { visibleScrollHeight, property: { scroll: { enable } } }    } = this    let isInnerScroll = false    // 检测实现滚动的主容器和辅助容器是否存在    if (listContMain && listContSupport) {      // 检测是否满足滚动条件，然后根据滚动条件控制辅助容器的显示状态及滚动状态      // 比较所有行的总高度和滚动区域可视高度，根据结果值可以判断是否满足滚动条件      if (enable && listContMain.clientHeight > parseInt(visibleScrollHeight)) {        listContSupport.style.display = 'table'        isInnerScroll = true      } else {        listContSupport.style.display = 'none'        isInnerScroll = false      }    }    return isInnerScroll  }  /**   * 滚动状态开关（需要配置列表滚动后，调用此方法才会产生效果）   * @param {boolean} [isPause] 是否暂停滚动 true:暂停 false:不暂停 缺省：根据当前状态设置为相反值   */  pause = (isPause) => {    if (this.state.property.scroll.enable && this.listContMain) {      if (isPause !== undefined) {        this.paused = isPause      } else {        this.paused = !this.paused      }      if (this.paused) {        // 删除上一次定时器，以停止滚动        clearInterval(this.marqueeInterval)      } else {        this.marquee()      }    }  }  /**   * 列表滚动实现   */  marquee = () => {    const {      state: {        property: { scroll: { enable, speed, distance } }      },      listContMain    } = this    // 设置定时器，实现列表滚动    if (listContMain && enable) {      let targetScrollTop      if (distance >= 0) {        targetScrollTop = util.getDistanceOfNextScroll(distance)      }      clearInterval(this.marqueeInterval)      this.marqueeInterval = setInterval(async () => {        if (distance < 0) {          this.scrollTo()        } else {          await this.updateInfoOfScrollingContainer({ targetScrollTop })        }      }, speed)    }  }  /**   * 滚动到{rowIndex}行   * @param {number} [rowIndex] 目标行索引。如果此值为假值，则使用第二个参数targetScrollTop   * @param {number} [targetScrollTop] 需要滚动到容器的scrollTop目标值，未传递时组件会根据内部变量firstRowIndexInViewableArea自动计算。当rowIndex的值为非数字时，此参数才生效   */  scrollTo = (rowIndex, targetScrollTop) => {    const {      state: {        property: { scroll: { distance } }      },      listContMain,      scrollContainer    } = this    // 检测rowIndex是否为数字    if (!isNaN(rowIndex)) {      if (rowIndex > 0) {        targetScrollTop = util.getDistanceOfNextScroll(NaN, listContMain.children, rowIndex)      } else {        targetScrollTop = 0      }    } else {      /**       * 这里调用`util.getDistanceOfNextScroll`的检测规则：       *  如果是非数字，则根据distance配置和当前可视区域第一行的索引自动计算       *  如果是是合法数字，则将数字转换为整型       */      targetScrollTop = util.getDistanceOfNextScroll(distance, listContMain.children, this.firstRowIndexInViewableArea)    }    // 时间恒定，根据需要移动的总距离求速度（等同于定时器每调用一次回调后，组件滚动的距离）    const scrollSpeed = util.getSpeed(targetScrollTop, scrollContainer)    // 设置一次性滚动定时器    this.marqueeIntervalRow = setInterval(async () => {      const isCompleted = await this.updateInfoOfScrollingContainer({ targetScrollTop, rowIndex }, true, scrollSpeed)      if (isCompleted) {        // 当滚动容器的scrollTop值达到预定的目标值（targetScrollTop）后，结束本次滚动        clearInterval(this.marqueeIntervalRow)        // 触发事件：一次性滚动结束        util.dispatchCustomEvent.call(this, 'custom_onScrollTo')      }    }, 4)  }  /**   * 更新主容器滚动相关的数据信息。默认平滑滚动。   * @param {{targetScrollTop: number, rowIndex?: number}} target 包含滚动终点信息的对象   *  targetScrollTop:要滚动到的目标（必需）；   *  rowIndex:要滚动到的行号。调用scrollTop(number)时的number数值。   * @param {boolean} [isNoncontinuous] 是否是不连续滚动。滚动方式根据设定的参数不同分为平滑滚动（匀速滚动）和一次性滚动（不连续滚动）。   * @param {number} [scrollSpeed] 不连续滚动时的滚动速度，isNoncontinuous是true时为必传参数。   * @returns {Promise<boolean>} 一次性滚动的滚动目标是否完成。   */  updateInfoOfScrollingContainer = (target, isNoncontinuous, scrollSpeed) => {    const {      listContMain: { clientHeight },      state: { property: { scroll: { distance } } }    } = this    // 平滑滚动    if (!isNoncontinuous) {      if (clientHeight <= this.scrollContainer.scrollTop) {        // 当列表滚动到底部则记为列表完全滚动一次        this.scrollFrequency++        // 完全滚动一次后，重置滚动容器的scrollTop值，实现无缝滚动        this.scrollContainer.scrollTop -= clientHeight        // 触发事件：滚动完整一圈        util.dispatchCustomEvent.call(this, 'custom_onScrollFullCircle')      } else {        this.scrollContainer.scrollTop += target.targetScrollTop        // 触发事件：滚动到组件尾部，即组件最后一行完全进入可视区域内后触发        const scrollToEnd = this.listContMain.offsetHeight - this.state.visibleScrollHeight        const currentScrollTop = Math.ceil(this.scrollContainer.scrollTop)        // 平滑滚动时，每次滚动`target.targetScrollTop`的距离，得出当最后一行完全出现在可视区域内时，        // `scrollToEnd`与`currentScrollTop`有可能不完全相等，只要在次区间内，        // 即`scrollToEnd <= currentScrollTop < scrollToEnd + target.targetScrollTop`，        // 则可以触发以下事件        if (currentScrollTop >= scrollToEnd && currentScrollTop < scrollToEnd + target.targetScrollTop) {          util.dispatchCustomEvent.call(this, 'custom_onScrollToEnd')        }      }    } else {      /* 一次性滚动 */      // 当滚动容器的scrollTop值未达到预定的目标值（targetScrollTop）时，持续滚动      // 注意，此处的`Math.ceil(scrollTop)`，是为了解决高分辨率屏幕下的scrollTop值是小数时，      // 存在scrollTop值与targetScrollTop（通过计算得出的整数）永远不相等，此时滚动会陷入死循环      if (Math.ceil(this.scrollContainer.scrollTop) !== target.targetScrollTop) {        let nextScrollDistance        const difference = target.targetScrollTop - this.scrollContainer.scrollTop        // 检测滚动目标值与滚动容器目前的scrollTop值的差值是否大于速度值，否则速度值按二者之间的差值计算。        //   （为了确保滚动的精准度，定时器的每一次回调都会检测滚动目标值（targetScrollTop）与滚动容器当前的scrollTop值的差值（difference），        //   根据上面计算得到的速度值（scrollSpeed），这里可以看成定时器每调用一次回调后滚动容器滚动的距离值，        //   当difference>=scrollSpeed时，定时器每调用一次回调的滚动距离取速度值即可，        //   当difference<scrollSpeed时，证明计时器下一次调用即为本次滚动的最后一次变化，距离为difference，        //   这样处理后，在每次滚动结束时，滚动的距离都会与设定的目标值保持一致，不会存在多滚动一点距离或少滚动一点距离的情况。）        if (difference >= scrollSpeed) {          nextScrollDistance = scrollSpeed        } else {          nextScrollDistance = difference        }        this.scrollContainer.scrollTop += nextScrollDistance      } else {        if (clientHeight <= Math.ceil(this.scrollContainer.scrollTop)) {          this.scrollContainer.scrollTop -= clientHeight          this.scrollFrequency++          // 触发事件：滚动完整一圈          util.dispatchCustomEvent.call(this, 'custom_onScrollFullCircle')          // rowIndex不是数字，则代表是使用者通过scrollTo(number)调用，作用仅仅是滚动到指定行。此时忽略以下逻辑          // 本组件内部调用统一为scrollTo()，自动根据state计算，不需要参数。          if (isNaN(target.rowIndex)) {            this.firstRowIndexInViewableArea = 0          }        } else {          if (isNaN(target.rowIndex)) {            this.firstRowIndexInViewableArea += Math.ceil(-distance)          }        }        // 达到一次性滚动的滚动目标值        return Promise.resolve(true)      }    }    // 非一次性滚动模式或一次性滚动未达目标值，默认返回false    return Promise.resolve(false)  }  /**   * 行hover事件   * @param {object} e event   */  rowHover = e => {    e.stopPropagation()    e.persist()    this.setState(prevState => ({ rowStyle: util.getRowStyle(prevState, e) }))  }  /**   * 复选框和单选按钮事件   * @param {object} cr 生成DOM的数据   * @param {Event} event 点击的input对象   */  checkCR = (cr, event) => {    const { target } = event    const { selected, data, property } = this.state    const selectedCur = { ...selected }    let targetName = target.name    let { indeterminate } = this.state    // 检测this.state.selected里与之对应的数组是否存在，否则初始化一个空数组    // 而radio因为是单选按钮，决定了state数组里面有且仅有一个值来表示被选中的按钮，所以每次都初始化为空数组    if (target.type === 'radio') {      // 检测是否是radio，radio需要处理一下this.state.selected里与之对应的name属性      targetName = targetName.substring(0, targetName.lastIndexOf('-'))      if (!selectedCur[targetName]) {        selectedCur[targetName] = []      }      // 将处理后结果赋值给state      selectedCur[targetName][0] = target    }    // 检测是否点击的是表头的checkbox，且是否启用表头    else if (target.type === 'checkbox') {      // 检测是否是行选择框      if (target.name === 'rowCheckbox') {        const { show: showHeader } = property.header        // 获取列表内所有的行选择框        const rowCheckboxes = this.scrollContainer.parentNode.querySelectorAll('[name=\'rowCheckbox\']')        // 当启用表头时，点击表头的行选择框        if (showHeader && _.isEqual(rowCheckboxes[0], target)) {          indeterminate = false          selectedCur[targetName] = new Array(data.length).fill(target)        } else {          /* 触发非表头的行选择框 */          // 获取触发的行选择框所在行的索引          const clickedActualIndex = _.findIndex(rowCheckboxes, target)          // 如果点击的是辅助容器内的行选择框，则对应到主容器内的行选择框的索引。          const mainIndex = clickedActualIndex >= data.length            ? clickedActualIndex - data.length + (showHeader ? 1 : 0) // 处理显示表头和不显示表头的情况            : clickedActualIndex          // 将处理后结果赋值给state          selectedCur[targetName][mainIndex] = target          // 每次触发body内的行选择框时都检查一次所有行选择框的状态          const rowCheckboxSelectedQuantity = _.compact(selectedCur[targetName].map(chk => chk.checked)            .slice(1)).length          // body内行选择框未全选中          if (rowCheckboxSelectedQuantity !== data.length - 1) {            selectedCur[targetName][0] = { checked: false }            indeterminate = rowCheckboxSelectedQuantity > 0          } else {            selectedCur[targetName][0] = { checked: true }            indeterminate = false          }        }      } else {        /* 非行选择框 */        if (!selectedCur[targetName]) {          selectedCur[targetName] = []        }        // 获取同一单元格内相同name的复选框        const checkboxes = this.listContMain.querySelectorAll(`[name='${targetName}']`)        // 获取触发的checkbox的索引        const clickedIndex = _.findIndex(checkboxes, target)        // 将处理后结果赋值给state        selectedCur[targetName][clickedIndex] = target      }    }    this.setState(      () => ({        indeterminate,        selected: selectedCur      }),      () => util.expPropsAndMethods.call(this, cr, event)    )  }  /**   * 设置单元格图标   * @param {object} ci icon对象   * @returns {JSX.Element} 单元格图标DOM结构   */  setCellImage = ci => {    const { iconStyle } = this.state.property.body.cell    const { builtInAttrs, attrs } = util.handleBuiltInAttributes(ci)    const { src } = attrs    const { id, key } = util.generateIdAndKeyForTag(attrs.key, builtInAttrs.type)    if (      src &&      typeof src === 'string' &&      (        src.indexOf('http://') !== -1 ||        src.indexOf('https://') !== -1 ||        src.indexOf('data:image/') !== -1      )    ) {      return (        <label htmlFor={id} key={key} style={iconStyle} className="list-cell-img">          <img            id={id}            alt={attrs.alt || id}            {...attrs}          />          {ci.text ? <span>{ci.text}</span> : null}        </label>      )    }  }  /**   * 设置单元格link(链接)   * @param {object} cl link对象   * @returns {JSX.Element} 链接DOM结构   */  setCellLink = cl => {    const { builtInAttrs, attrs } = util.handleBuiltInAttributes(cl)    const { text, event, type } = builtInAttrs    let tagProps = {      ...util.generateIdAndKeyForTag(attrs.key, type),      ...attrs    }    // 如果存在href属性，则不再另行添加事件    if (attrs.href) {      tagProps = {        ...tagProps,        onClick: util.handleEvent.bind(this) // 此函数是为了防止事件冒泡      }    } else {      tagProps = {        ...tagProps,        [event ? event : 'onClick']: util.handleEvent.bind(this, [cl])      }    }    return (      <a {...tagProps} >{text}</a>    )  }  /**   * 设置单元格checkbox、radio、input或button   * @param {object} cr cr对象   * @param {number?} rowIndex 所在行的索引   * @param {number?} cellIndex 所在单元格的索引   * @param {number?} index 当前索引   * @param {string?} container 当前渲染元素所在的容器   * @returns {JSX.Element} 单元格checkbox或radio的DOM结构   */  setCellInput = (cr, { rowIndex, cellIndex, index }, container) => {    let tagProps    const { builtInAttrs, attrs } = util.handleBuiltInAttributes(cr)    if (cr.type === 'button') {      tagProps = {        [cr.event ? cr.event : 'onClick']: util.handleEvent.bind(this, [cr]),        type: 'button',        ...util.generateIdAndKeyForTag(attrs.key, 'button'),        ...attrs      }      return <input {...tagProps} />    } else if (cr.type === 'input') {      const { event, text } = builtInAttrs      const { id, key } = util.generateIdAndKeyForTag(attrs.key, 'input')      tagProps = {        [event ? event : 'onClick']: util.handleEvent.bind(this, [cr]),        type: 'text',        id,        ...attrs      }      return (        <label htmlFor={tagProps.id} className="list-cell-input" key={key}>          {text ? <span>{text + ' '}</span> : ''}          <input id={tagProps.id} {...tagProps} />        </label>      )    } else { // checkbox or radio      const { event, type, text } = builtInAttrs      const { value, name } = attrs      const { selected } = this.state      const selectedCur = selected[name] || []      const { id, key } = util.generateIdAndKeyForTag(attrs.key, type)      // 处理标签属性      tagProps = {        id,        type,        ...attrs,        value: value !== undefined          ? value          : (            name === 'rowCheckbox'              ? `rowChk-${rowIndex}`              : `react-tabllist-value-${rowIndex}-${cellIndex}-${index}`          ),        name: type === 'radio' ? `${name}-${container}` : name,        className: `${          type === 'radio'            ? 'list-cell-radio'            : 'list-cell-chk'        }${          attrs.className            ? ` ${attrs.className}`            : ''        }`      }      // 处理选中状态      let tempIndex      if (type === 'checkbox') {        // 复选框保存被选中框的索引        if (name === 'rowCheckbox') {          tempIndex = rowIndex        } else {          tempIndex = index        }        tagProps.checked = !!(selectedCur[tempIndex] && selectedCur[tempIndex].checked)      } else if (type === 'radio') {        // 单选按钮保存被选中按钮的key值        tagProps.checked = !!(selectedCur[0] && selectedCur[0].name.substring(0, selectedCur[0].name.lastIndexOf('-')) === name + '' && selectedCur[0].value === tagProps.value + '')      }      // 处理事件      if (event && event !== 'onClick' && event !== 'onChange') {        tagProps[event] = util.handleEvent.bind(this, [cr])      }      tagProps.onChange = util.handleEvent.bind(this, [        cr,        this.checkCR.bind(null, cr)      ])      tagProps.onClick = util.handleEvent.bind(this, [])      // 打印警告信息      if (type === 'radio' && !container) {        console.error('When the type attribute of the input tag is radio, the third parameter "container" of setCellInput() is a required parameter, otherwise the function will be invalid!')        return null      }      // 处理 JSX      if (type === 'radio' || type === 'checkbox') {        const {          show: rowCheckboxShow,          style: rowCheckboxStyle,          specialStyle        } = this.state.property.body.row.rowCheckbox        const style = rowCheckboxShow && key && key.match(/^rowCheck\d+/)          ? {            ...rowCheckboxStyle,            ...specialStyle[rowIndex - 1]          }          : {}        return (          <label            htmlFor={id}            key={key}            onClick={util.handleEvent.bind(this, [])} // 处理冒泡            style={style}            className={`list-cell-${type}`} // className is list-cell-radio or list-cell-checkbox          >            <input {...tagProps} />            {text ? <span>{text}</span> : null}          </label>        )      }    }  }  /**   * 设置单元格的下拉列表   * @param {object} cs 对象单元   * @return {JSX.Element} 单元格select的DOM结构   */  setCellSelect = (cs) => {    const { builtInAttrs, attrs } = util.handleBuiltInAttributes(cs)    const { text, option, event, type } = builtInAttrs    const { id, key } = util.generateIdAndKeyForTag(attrs.key, type)    const tagProps = {      id,      [event ? event : 'onChange']: util.handleEvent.bind(this, [cs]),      ...attrs    }    return (      <label htmlFor={id} key={key} className="list-cell-select">        {text ? <span>{text}</span> : null}        <select {...tagProps}>          {            option && option.map((item, index) => <option key={`${id}-option-${index}`} {...item} />)          }        </select>      </label>    )  }  /**   * 设置单元格内的对象单元文本   * @param {object} ct 对象单元   * @param {number} rowIndex 行索引   * @return {JSX.Element} Text的DOM结构   */  setCellText = (ct, { rowIndex }) => {    const { header, body } = this.state.property    const {      show: serialNumberShow,      style: serialNumberStyle,      specialStyle    } = body.row.serialNumber    const { builtInAttrs, attrs } = util.handleBuiltInAttributes(ct)    const { id, key } = util.generateIdAndKeyForTag(attrs.key, builtInAttrs.type)    const { text, event, callback } = builtInAttrs    let style = serialNumberShow && key.match(/^listSN\d+/)      ? {        ...(!header.show || rowIndex !== 0 ? serialNumberStyle : {}),        ...specialStyle[rowIndex - 1],        ...attrs.style      }      : attrs.style    // 处理内置样式表    attrs.className = attrs.className ? `list-cell-text ${attrs.className}` : attrs.className    // 处理默认事件及回调函数    if (typeof callback === 'function') {      style = { ...style, cursor: 'pointer' }      if (event) {        attrs[event] = util.handleEvent.bind(this, [ct])      } else {        attrs['onClick'] = util.handleEvent.bind(this, [ct])      }    }    return (      <span        id={id}        key={key}        {...attrs}        style={style}      >        {text}      </span>    )  }  /**   * 设置单元格   * @param {Array} rowData 行数据   * @param {number} rowIndex 行索引   * @param {string} container 当前所在容器的名称   * @return {JSX.Element[]}   */  setCell = (rowData, rowIndex, container) => {    const { colWidth, property, rowStyle } = this.state    const {      cellOfColumn: { style: cellOfColumnStyle },      cell: { style }    } = property.body    // 处理border属性值    const listBorder = this.setBorder(style)    return rowData.map((cellData, cellIndex) => {      return (        <div          key={`${container}-cell-r${rowIndex}-c${cellIndex}`}          className="list-cell"          style={{            height: rowStyle[rowIndex] ? rowStyle[rowIndex].height : 'auto',            ...style,            width: typeof colWidth === 'string' ? colWidth : (colWidth[cellIndex] || 'auto'),            ...cellOfColumnStyle[cellIndex],            ...listBorder          }}        >          {this.parsing(cellData, { rowIndex: rowIndex + 1, cellIndex }, container)}        </div>      )    })  }  /**   * 解析数据里面的对象   * @param {object} cellData 需要解析的单元格数据   * @param {number} rowIndex 需要解析的单元格数据所在行的索引   * @param {number} cellIndex 需要解析的单元格数据所在行的索引   * @param {number?} index 当前循环遍历的index   * @param {string?} container 当前渲染单元格所在的容器（此参数目前只在type为radio时生效）   * @returns {*} 单元格数据或DOM   */  parsing = (cellData, { rowIndex, cellIndex, index }, container) => {    if (Array.isArray(cellData)) {      return cellData.map((o, i) => this.parsing(o, { rowIndex, cellIndex, index: i }, container))    }    if (_.isObject(cellData)) {      switch (cellData.type) {        case 'link':          return this.setCellLink(cellData)        case 'select':          return this.setCellSelect(cellData)        case 'img':          return this.setCellImage(cellData)        case 'text':          return this.setCellText(cellData, { rowIndex })        case 'input':          return this.setCellInput(cellData, { rowIndex, cellIndex, index })        case 'radio':        case 'checkbox':        case 'button':          return this.setCellInput(cellData, { rowIndex, cellIndex, index }, container)      }    }    // 不是指定对象，返回原数据    return cellData  }  /**   * 设置边框   * 检测到空值则使用全局配置，而不是设置为无边框   * @param {object} borderStyle 含有边框属性的对象   * @returns {object} 返回包含border及其相关属性的对象   */  setBorder = (borderStyle) => {    const { border } = this.state.property    const newBorder = {}    // borderStyle对象的border属性为空字符串    if (borderStyle && borderStyle.border === '') {      return border    }    // borderStyle对象的border属性为空值以外的其他假值    if (!borderStyle.border) {      newBorder.borderWidth = borderStyle.borderWidth || border.borderWidth      newBorder.borderColor = borderStyle.borderColor || border.borderColor      newBorder.borderStyle = borderStyle.borderStyle || border.borderStyle      return newBorder    }    return { border: borderStyle.border }  }  /**   * 设置行   * @param {array} bodyData 列表主体数据   * @param {string} container 当前所在容器的名称   * @returns {*} 列表主体DOM   */  setRow = (bodyData, container) => {    const { property, transitionName, rowStyle } = this.state    const { body: { row: { transition } } } = property    // 处理行动画的样式    const transitionClassName = transition ? ` ${transitionName}` : ''    return bodyData.map((rowData, rowIndex) => {      const customClassName = rowData.className ? ` ${rowData.className}` : ''      let LIElementProps = {        className: `list-row${customClassName}${transitionClassName}`,        style: rowStyle[rowIndex],        onMouseEnter: this.rowHover,        onMouseLeave: this.rowHover      }      // 检测行数据是一个对象还是一个数组      // 如果是对象，则需要对行数据做一些处理，比如添加自定义事件等（目前只支持添加事件）      if (_.isPlainObject(rowData) && rowData.type === 'row') {        LIElementProps[rowData.event] = util.handleEvent.bind(this, [rowData])        LIElementProps.value = rowData.value      } else {        LIElementProps = { ...LIElementProps, type: 'row' }      }      return (        <li          key={`list-row-${container}-${rowData.key ? rowData.key : rowIndex}`}          {...LIElementProps}        >          {            _.isArray(rowData)              ? this.setCell(rowData, rowIndex, container)              : this.setCell(rowData.cells, rowIndex, container)          }        </li>      )    })  }  /**   * 加载列表头   * @param {array} data 列表头数据   * @returns {*} 列表头DOM   */  loadHeader = data => {    const { property, colWidth, headerWidth } = this.state    const { scroll: { enable }, header: { style, cellStyle, show: showHeader } } = property    const {      cell: { style: { minWidth } }    } = property.body    // 处理border属性值    const listBorder = this.setBorder(cellStyle)    if (showHeader && data && data.length) {      return (        <ul          ref={ele => this.herderContainer = ele}          className="list-header list-cont"          style={            !enable && headerWidth              ? {                width: headerWidth              } : null          }        >          <li key="list-row" className="list-row" style={style}>            {              data.map((cell, index) => (                <div                  className="list-cell"                  title={_.isObject(cell) ? cell.text : cell}                  key={`list-header-${index}`}                  style={{                    ...cellStyle,                    width: typeof colWidth === 'string' ? colWidth : (colWidth[index] || 'auto'),                    minWidth,                    ...listBorder                  }}                >                  {this.parsing(cell, { rowIndex: 0, cellIndex: 0 })}                </div>              ))            }          </li>        </ul>      )    }    return null  }  /**   * 加载列表主体   * @param bodyData   * @returns {*}   */  loadBody = bodyData => {    const {      visibleScrollHeight,      property: {        body: {          style,          row: { spacing }        },        scroll: { enable }      }    } = this.state    // 处理css属性‘border-collapse’与‘border-spacing’的值    const listContStyle = util.getListContStyle(spacing)    return (      <div        className="list-body"        ref={ele => this.scrollContainer = ele}        style={{ ...style, height: visibleScrollHeight, overflowY: enable ? 'hidden' : 'auto' }}        {...this.events.scrollContainer}      >        <ul          className="list-cont"          style={listContStyle}          ref={ele => this.listContMain = ele}        >          {this.setRow(bodyData, 'main')}        </ul>        <ul          className="list-cont"          style={listContStyle}          ref={ele => this.listContSupport = ele}        >          {this.setRow(bodyData, 'support')}        </ul>      </div>    )  }  /**   * 渲染 DOM 结构   * @returns {*} 组件DOM   */  render = () => {    const {      property: {        header: { show: showHeader },        body: { row: { spacing } },        style: conStyle      },      data,      className    } = this.state    // 处理border属性值    const listBorder = this.setBorder(conStyle)    // 当存在表头数据且表头是开启时处理数据    let headerData    let bodyData    this.renderData = util.fillRow(data, this.state)    if (showHeader && data.length) {      [headerData, ...bodyData] = this.renderData    } else {      bodyData = this.renderData    }    const listClass = !Number.isNaN(parseInt(spacing)) && parseInt(spacing) > 0 ? '' : 'list-no-spacing'    return (      <div        ref={ele => this.mainContainer = ele}        style={{ ...listBorder, ...conStyle }}        className={`__tabllist__${listClass ? ` ${listClass}` : ''}${className ? ` ${className}` : ''}`}        {...this.events.mainContainer}      >        {this.loadHeader(headerData)}        {this.loadBody(bodyData)}      </div>    )  }}
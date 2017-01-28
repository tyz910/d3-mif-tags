var Layout = (function () {
    function Layout(wrapper, opts) {
        this.wrapper = wrapper;
        this.opts = opts;
        this.svg = this.wrapper.select('svg');
        this.map = this.svg.append('g').attr('id', 'map');
        this.uni = this.map.append('g').attr('id', 'universe');
        this.moveBlock = false;
        this.onMove = null;
    }

    Layout.prototype.svgWidth = function () {
        return this.svg.node().clientWidth || this.svg.node().parentNode.clientWidth;
    };

    Layout.prototype.svgHeight = function () {
        return this.svg.node().clientHeight || this.svg.node().parentNode.clientHeight;
    };

    Layout.prototype.getMousePos = function () {
        var m = d3.mouse(this.map.node());

        return {
            x: m[0],
            y: m[1]
        };
    };

    Layout.prototype.addFullScreen = function (trigger, onChange) {
        var wrapperNode = this.wrapper.node();
        var reqFs = this.reqFS = wrapperNode.requestFullScreen || wrapperNode.webkitRequestFullScreen || wrapperNode.mozRequestFullScreen || wrapperNode.msRequestFullscreen;
        var fsEnabled = false;

        if (reqFs) {
            trigger.classed('fs', true).on('click', function () {
                reqFs.call(wrapperNode);
            });

            if (onChange) {
                var screenChangeEvents = "webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange";
                $(document).on(screenChangeEvents, function () {
                    fsEnabled = !fsEnabled;

                    // redraw
                    wrapperNode.style.display = 'none';
                    wrapperNode.offsetHeight;
                    wrapperNode.style.display = '';

                    onChange(fsEnabled);
                });
            }
        }

        return this;
    };

    Layout.prototype.addDrag = function () {
        var self = this;

        this.drag = d3.behavior.drag()
            .on("dragstart", function () {
                self.dragMove = null;
                self.dragCenter = self.getMapCenter();
            })
            .on("drag", function () {
                if (!self.dragMove) {
                    self.dragMove = {
                        x: 0,
                        y: 0
                    };
                }

                self.dragMove.x += d3.event.dx;
                self.dragMove.y += d3.event.dy;

                var moveTo = {
                    x: self.dragCenter.x - self.dragMove.x,
                    y: self.dragCenter.y - self.dragMove.y
                };

                self.moveToClick(moveTo, self.opts.mapDragTransition);
            })
            .on("dragend", function () {
                if (self.dragMove) {
                    var dx = Math.abs(self.dragMove.x);
                    var dy = Math.abs(self.dragMove.y);

                    if ((dx > self.opts.mapDragMin) || (dy > self.opts.mapDragMin)) {
                        return;
                    }
                }

                self.dragMove = null;
            })
        ;

        this.svg.call(this.drag);
        return this;
    };

    Layout.prototype.moveToClick = function (point, transition) {
        if (!this.moveBlock) {
            if (!point) {
                point = this.getMousePos();
            }

            var bounds = this.map.node().getBBox();
            $.each({x: 'width', y: 'height'}, function (axis, dimension) {
                var min = bounds[axis];
                if (point[axis] < min) {
                    point[axis] = min;
                }

                var max = bounds[dimension] + bounds[axis];
                if (point[axis] > max) {
                    point[axis] = max;
                }
            });

            this.moveToPoint(point, null, transition);
        }
    };

    Layout.prototype.moveToPoint = function (point, onEnd, transition) {
        var self = this;

        this._moveMap(point.x, point.y, function (x, y) {
            var center = self.getMapMoveCenter(point.x, point.y);
            var delta = Math.abs(x - center.x) + Math.abs(y - center.y);

            if (delta < self.opts.mapMoveError) {
                self.map
                    .attr('transform', Layout.transformTranslate(center.x, center.y))
                ;

                if (onEnd) {
                    onEnd();
                }
            } else {
                self.moveToPoint(point, onEnd, transition);
            }
        }, transition);
    };

    Layout.prototype.moveToCenter = function (onEnd, transition) {
        this.moveToPoint(this.getMapCenter(), onEnd, transition);
    };

    Layout.prototype._moveMap = function (x, y, onEnd, transition) {
        var self = this;
        var move = this.getMapMoveCenter(x, y);
        if (typeof transition === 'undefined') {
            transition = this.opts.mapMoveTransition;
        }

        this._moveBg(x, y, transition);

        var map = this.map;
        if (transition) {
            map = map.transition().duration(transition);
        }

        map.attr('transform', Layout.transformTranslate(move.x, move.y));

        if (transition) {
            map.each('end', function () {
                if (onEnd) {
                    onEnd(move.x, move.y);
                }

                if (self.onMove) {
                    self.onMove();
                }
            });
        } else {
            if (onEnd) {
                onEnd(move.x, move.y);
            }

            if (this.onMove) {
                this.onMove();
            }
        }
    };

    Layout.prototype._moveBg = function (x, y, transition) {
        var xPercent = 50 + x / this.opts.mapMoveBgStepX;
        var yPercent = 50 + y / this.opts.mapMoveBgStepY;

        if (typeof transition === 'undefined') {
            transition = this.opts.mapMoveTransition;
        }

        var svg = this.svg;
        if (transition) {
            svg = svg.transition().duration(transition)
        }

        svg.style('background-position', xPercent + '% ' + yPercent + '%');
    };

    Layout.prototype.getMapMoveCenter = function (x, y) {
        return {
            'x': this.svgWidth() / 2 - x,
            'y': this.svgHeight() / 2 - y
        };
    };

    Layout.prototype.getMapCenter = function () {
        var pos = this.getMapPos();
        return this.getMapMoveCenter(pos.x, pos.y);
    };

    Layout.prototype.getMapPos = function() {
        var pos = d3.transform(this.map.attr("transform")).translate;

        return {
            x: pos[0],
            y: pos[1]
        };
    };

    Layout.prototype.getVisibleArea = function (xMultiplier, yMultiplier, dx, dy) {
        dx = dx || 0;
        dy = dy || 0;
        xMultiplier = xMultiplier || 1;
        yMultiplier = yMultiplier || 1;

        dx += (this.svgWidth() / 2) * xMultiplier;
        dy += (this.svgHeight() / 2) * yMultiplier;
        var center = this.getMapCenter();

        var area = new Object({
            'x1': center.x - dx,
            'y1': center.y - dy,
            'x2': center.x + dx,
            'y2': center.y + dy,
            'x': center.x,
            'y': center.y,
            'width': dx * 2,
            'height': dy * 2
        });

        area.inArea = function (pointX, pointY) {
            return (pointX >= area.x1) && (pointX <= area.x2) && (pointY >= area.y1) && (pointY <= area.y2);
        };

        return area;
    };

    Layout.move = function (move, point, targetPoint, error) {
        ['x', 'y'].forEach(function (axis) {
            if (!error || (Math.abs(point[axis] - targetPoint[axis]) > error)) {
                point[axis] += (point[axis] < targetPoint[axis]) ? move : -move;
            }
        });
    };

    Layout.angle = function (point, center) {
        if (!center) {
            center = {
                x: 0,
                y: 0
            };
        }

        return Math.atan2(point.y - center.y, point.x - center.x) * 180 / Math.PI;
    };

    Layout.transformTranslate = function (x, y) {
        return "translate(" + x + "," + y + ")";
    };

    return Layout;
})();

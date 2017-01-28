var Universe = (function () {
    function Universe(wrapper, data, opts) {
        this.opts = $.extend({
            'minRadius': 5,
            'maxRadius': 20,
            'minFont': 12,
            'maxFont': 24,

            'legendColumns': 9,

            'theta': 0.8,
            'gravity': 0.3,
            'friction': 0.8,
            'linkDistanceMax': 40,
            'charge': -300,
            'chargeDistance': 2000,
            'megaLinkMultiplier': 2,
            'megaChargeMultiplier': 2.5,
            'forceStop': false,
            'forceInitStopTimeout': 20000,
            'forceStopTimeout': 3000,
            'forceStartTimeout': 500,

            'mapMoveBgStepX': 1300 / 10,
            'mapMoveBgStepY': 800 / 10,
            'mapMoveTransition': 400,
            'mapMoveError': 250,
            'mapDragMin': 20,
            'mapDragTransition': 0,

            'catGroupForce': 10,
            'catGroupForceErrorDelta': 500,
            'catGroupWarmUpOnly': true,

            'starRadius': 50,
            'starMaxPlanets': 10,
            'starPlanetSizes': [100, 80, 70, 60],
            'starPlanetDistances': [0, 150, 50, 50, 5],
            'starGravity': 0.3,
            'starFriction': 0.8,
            'starCharge': -50,
            'starChargeDistance': 250,

            'specialClickSizeMultiplier': 10,
            'specialClickSizeTimeout': 1000,
            'visibilityControl': false
        }, opts || {});

        this.books  = data.books;
        this.tags   = data.tags;
        this.cats   = data.cats;

        this.layout = new Layout(wrapper, this.opts);
        this.legend = new Legend(this);

        this.color = d3.scale.ordinal()
            .domain(Object.keys(this.cats))
            .range([
                "#FFFFFF", // Бизнес
                "#0DD5FC", // Маркетинг
                "#F3F315", // Cаморазвитие
                "#c32aff", // Творчество
                "#C1FD33", // Здоровый образ жизни
                "#FF9933", // Детские книги
                "#FC5AB8"  // Расширяющие кругозор
            ])
        ;

        this.font = d3.scale.linear()
            .range([this.opts.minFont, this.opts.maxFont])
            .domain([this.opts.minRadius, this.opts.maxRadius])
        ;

        this.nodes = this._scaleNodes(data.nodes, this.opts.minRadius, this.opts.maxRadius);
        this.links = data.links;
        this.force = d3.layout.force();

        this.star = null;
        this.warmUp = true;
        this.catMeans = {};
        this.lastVisibleArea = null;
    }

    Universe.prototype.addSpecial = function (special) {
        this.nodes.push(special.setUni(this));
    };

    Universe.prototype._scaleNodes = function (nodes, minRadius, maxRadius) {
        var radius = d3.scale.linear()
            .range([minRadius, maxRadius])
            .domain([0, d3.max(nodes, function (d) {
                return d.size;
            })])
        ;

        d3.map(nodes, function (d) {
            d.size = Math.ceil(radius(d.size));
        });

        return nodes;
    };

    Universe.prototype._buildForce = function () {
        var self = this;
        return this.force.size([this.layout.svgWidth(), this.layout.svgHeight()])
            .nodes(this.nodes)
            .links(this.links)
            .gravity(this.opts.gravity)
            .friction(this.opts.friction)
            .theta(this.opts.theta)
            .linkDistance(function (d) {
                var c = (d.target.mega || d.source.mega) ? self.opts.megaLinkMultiplier : 1;
                return c * (d.target.size + d.source.size + (self.opts.linkDistanceMax * (1 - d.val)));
            })
            .charge(function (d) {
                var c = d.mega ? self.opts.megaChargeMultiplier : 1;
                return self.opts.charge * d.size * c;
            })
            .chargeDistance(this.opts.chargeDistance)
        ;
    };

    Universe.prototype._buildLayout = function () {
        var self = this;
        var uni = this.layout.uni;

        var link = this.layout.link = uni.selectAll('.link')
            .data(this.links).enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', function (d) {
                if (d.target.size > d.source.size) {
                    return self.color(self.tags[d.target.id].cat);
                } else {
                    return self.color(self.tags[d.source.id].cat);
                }
            })
        ;

        var node = this.layout.node = uni.selectAll('.node')
            .data(this.nodes).enter()
            .append('g').classed('node', true)
        ;

        // specials
        node
            .filter(function (d) {
                return d.special;
            })
            .classed('special-node', true)
            .each(function (d) {
                d.init(this);
            })
        ;

        // tags
        var tags = node
            .filter(function (d) {
                return d.id;
            })
            .classed('tag', true)
            .attr('id', function (d) {
                return 'tag-' + d.id;
            })
            .each(function () {
                this.parentNode.appendChild(this);
            })
        ;

        tags.append('circle')
            .style('fill', function (d) {
                return self.color(self.tags[d.id].cat);
            })
        ;

        tags.append('text')
            .attr('text-anchor', 'middle')
            .attr('fill', function (d) {
                return self.color(self.tags[d.id].cat);
            })
            .text(function (d) {
                return self.tags[d.id].title;
            })
        ;

        this.tagNodeSizeUpdated(tags);
    };

    Universe.prototype.startForce = function (isStop, stopTimeout) {
        var force = this.force;

        force.start();
        if (isStop) {
            setTimeout(function () {
                force.stop();
            }, stopTimeout);
        }
    };

    Universe.prototype.bigBang = function () {
        this._buildForce();

        var self = this;
        setTimeout(function () {
            self._buildLayout();
            self.layout
                .addFullScreen(d3.select('#graph_header'), function (enabled) {
                    if (self.star) {
                        self.layout.moveToPoint(self.star.d);
                    }

                    self.updateVisibility();
                })
                .addDrag()
            ;

            self.layout.svg.on('click', function () {
                if (!self.layout.dragMove) {
                    self.mapClick();
                }
            });

            self.layout.node.on('click', function (d) {
                if (!self.layout.dragMove) {
                    self.nodeClick(d);
                }

                d3.event.stopPropagation();
            });

            self.warmUp = false;
            self.force.alpha(0.2);
            self.force.tick();
            if (self.opts.catGroupWarmUpOnly) {
                self.opts.catGroupForce = 0;
            }

            self.force.on('tick', function (e) {
                self.tick(e);
            });

            self.layout.onMove = function () {
                self.updateVisibility();

                if (self.star && self.star.exploded) {
                    var d = self.star.d;
                    var c = self.layout.getMapCenter();

                    if (Math.max(Math.abs(c.x - d.x), Math.abs(c.y - d.y)) > d.size) {
                        self.nodeClick(d);
                    }
                }
            };

            self.layout.moveToCenter();
        }, this.opts.forceStartTimeout);

        this.startForce(this.opts.forceStop, this.opts.forceStopTimeout + this.opts.forceInitStopTimeout);
        this.legend.draw();

        this.force.on('tick', function (e) {
            self._warmUpTick(e);
        });
    };

    Universe.prototype.calculateCatMeans = function () {
        var self = this;

        d3.nest()
            .key(function(d) {
                return self.tags[d.id].cat;
            })
            .entries(this.nodes.filter(function (d) {
                return d.id;
            }))
            .forEach(function (d) {
                self.catMeans[d.key] = {
                    x: d3.mean(d.values, function (d) {
                        return d.x;
                    }),

                    y: d3.mean(d.values, function (d) {
                        return d.y;
                    })
                };
            })
        ;

        return self.catMeans;
    };

    Universe.prototype._groupCatNodes = function (alpha) {
        var self = this;
        var catMeans = this.calculateCatMeans();

        this.nodes.forEach(function (d) {
            if (!d.fixed && d.id) {
                var cat = self.tags[d.id].cat;
                var catMean = catMeans[cat];

                var move = alpha * self.opts.catGroupForce;
                $.each(catMean, function (c, m) {
                    if (Math.abs(d[c] - m) > self.opts.catGroupForceErrorDelta) {
                        d[c] += (d[c] < m) ? move : -move;
                    }
                });
            }
        });
    };

    Universe.prototype._warmUpTick = function (e) {
        if (this.warmUp) {
            this.force.alpha(1);
        }
    };

    Universe.prototype.updateVisibility = function () {
        if (this.opts.visibilityControl) {
            var r = this.opts.maxRadius;
            var lastArea = this.lastVisibleArea;
            var area = this.layout.getVisibleArea(1.1, 1.1, r, r);
            var forceLowAlpha = this.force.alpha() < 0.15;

            if (lastArea && forceLowAlpha) {
                if (Math.max(Math.abs(lastArea.width - area.width), Math.abs(lastArea.height - area.height)) < r) {
                    if (Math.max(Math.abs(lastArea.x - area.x), Math.abs(lastArea.y - area.y)) < r) {
                        return;
                    }
                }
            }

            this.lastVisibleArea = area;

            this.layout.node
                .each(function (d) {
                    var visible = area.inArea(d.x, d.y);
                    if (d.visible !== visible) {
                        d.visible = visible;
                        d3.select(this).classed('hidden', !visible);
                    }
                })
            ;

            this.layout.link
                .each(function (d) {
                    var visible = d.source.visible || d.target.visible;
                    if (d.visible !== visible) {
                        d.visible = visible;
                        d3.select(this).classed('hidden', !visible);
                    }
                })
            ;
        }
    };

    Universe.prototype.tick = function (e) {
        var layout = this.layout;

        if (this.star) {
            this.star.fixPosition();
        }

        if (this.opts.catGroupForce > 0) {
            this._groupCatNodes(e.alpha);
        }

        this.updateVisibility(true);

        layout.node
            .filter(function (d) {
                return d.special;
            }).each(function (d) {
                d.tick(e, this);
            })
        ;

        layout.node
            .attr('transform', function (d) {
                return Layout.transformTranslate(d.x, d.y);
            })
        ;

        layout.link
            .attr('x1', function(d) {
                return d.source.x;
            })
            .attr('y1', function(d) {
                return d.source.y;
            })
            .attr('x2', function(d) {
                return d.target.x;
            })
            .attr('y2', function(d) {
                return d.target.y;
            })
        ;
    };

    Universe.prototype.tagNodeSizeUpdated = function (node) {
        var self = this;

        node.select('circle')
            .attr('r', function (d) {
                return d.size;
            })
        ;

        node.select('text')
            .attr('dy', function (d) {
                return self.font(d.size) + d.size;
            })
            .style('font-size', function (d) {
                return self.font(d.size) + 'px';
            })
        ;
    };

    Universe.prototype.mapClick = function () {
        if (!this.star) {
            this.layout.moveToClick();
        }
    };

    Universe.prototype.nodeClick = function (d) {
        if (d.special) {
            d.click();
            return;
        }

        var newStar = true;

        if (this.star) {
            newStar = this.star.d != d;
            this.star.collapse();
            delete this.star;
        }

        if (newStar) {
            var star = this.star = new Star(this, d);
            this.layout.moveToPoint(d, function () {
                star.explode();
            });
        }

        this.startForce(this.opts.forceStop, this.opts.forceStopTimeout);
    };

    Universe.prototype.getTagNode = function (id) {
        return this.nodes[this.tags[id].i];
    };

    return Universe;
})();
